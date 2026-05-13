const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fsStream = require('fs');
const path = require('path');
const { shell, app } = require('electron');
const db = require('../db.cjs');

/**
 * Task 2: Google Contacts & Drive Sync Module
 * Menerapkan Sinkronisasi Kontak dan Backup Otomatis ke Cloud dengan Kill-Switch.
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 3456;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const getTokenPath = () => path.join(app ? app.getPath('userData') : process.cwd(), 'google_token.json');

/**
 * Mengecek apakah fitur Auto-Backup Drive sedang menyala/aktif
 */
const getDriveSyncStatus = () => {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_drive'").get();
    return row ? row.value === '1' : false;
  } catch (e) {
    return false;
  }
};

/**
 * Menyimpan status On/Off dari fitur Auto-Backup Drive ke Database
 */
const toggleDriveSyncStatus = (isEnabled) => {
  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_backup_drive', ?)")
      .run(isEnabled ? '1' : '0');
    return { success: true, isEnabled };
  } catch (error) {
    console.error("[GOOGLE SYNC] Error toggling drive sync status:", error);
    throw error;
  }
};

const googleLogin = () => {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return reject(new Error("Google Client ID/Secret belum dikonfigurasi di .env"));
    }

    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = new url.URL(req.url, `http://localhost:${PORT}`);
        const code = parsedUrl.searchParams.get('code');

        if (code) {
          res.end('<h1>Autentikasi Sukses!</h1><p>Anda bisa menutup tab ini dan kembali ke Aplikasi POS.</p>');
          server.close();

          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);
          await fs.writeFile(getTokenPath(), JSON.stringify(tokens));
          resolve({ success: true });
        }
      } catch (error) {
        if (server.listening) server.close();
        reject(error);
      }
    });

    server.listen(PORT, () => {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/contacts',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });
      shell.openExternal(authUrl);
    });

    setTimeout(() => {
      if (server.listening) {
        server.close();
        reject(new Error('Login timeout. Sesi dibatalkan.'));
      }
    }, 180000);
  });
};

const syncCustomersToGoogle = async () => {
  try {
    const tokenPath = getTokenPath();
    const tokenData = await fs.readFile(tokenPath, 'utf8');
    oauth2Client.setCredentials(JSON.parse(tokenData));

    const service = google.people({ version: 'v1', auth: oauth2Client });
    const unsyncedCustomers = db.prepare(`
      SELECT id, name, phone, email 
      FROM customers 
      WHERE google_contact_id IS NULL AND phone IS NOT NULL AND phone != ''
    `).all();

    if (unsyncedCustomers.length === 0) return { synced: 0 };

    let syncedCount = 0;
    const BATCH_SIZE = 30;
    for (let i = 0; i < unsyncedCustomers.length; i += BATCH_SIZE) {
      const batch = unsyncedCustomers.slice(i, i + BATCH_SIZE);
      const contactsToCreate = batch.map(c => ({
        contactPerson: {
          names: [{ givenName: c.name }],
          phoneNumbers: [{ value: c.phone, type: 'mobile' }],
          emailAddresses: c.email ? [{ value: c.email, type: 'work' }] : []
        }
      }));

      const response = await service.people.batchCreateContacts({
        requestBody: { contacts: contactsToCreate, readMask: 'names,phoneNumbers' }
      });

      const updateStmt = db.prepare(`UPDATE customers SET google_contact_id = ? WHERE id = ?`);
      db.exec('BEGIN TRANSACTION;');
      if (response.data.createdPeople) {
        response.data.createdPeople.forEach((result, index) => {
          if (result.person && result.person.resourceName) {
            updateStmt.run(result.person.resourceName, batch[index].id);
            syncedCount++;
          }
        });
      }
      db.exec('COMMIT;');
      if (i + BATCH_SIZE < unsyncedCustomers.length) await new Promise(r => setTimeout(r, 2000));
    }

    db.prepare("INSERT INTO sync_logs (sync_type, status, records_processed) VALUES (?, ?, ?)")
      .run('google_contacts', 'SUCCESS', syncedCount);

    return { synced: syncedCount };
  } catch (error) {
    try { db.exec('ROLLBACK;'); } catch(e) {}
    throw error;
  }
};

const uploadFileToGoogleDrive = async (filePath, originalFileName) => {
  // Check Kill-Switch
  if (!getDriveSyncStatus()) {
    console.log("[DRIVE] Auto-Backup dibatalkan: Fitur dinonaktifkan di pengaturan.");
    return { success: false, message: 'Disabled' };
  }

  try {
    const tokenPath = getTokenPath();
    if (!fsStream.existsSync(tokenPath)) {
        console.warn("[DRIVE] Token tidak ditemukan, melewati upload otomatis.");
        return null;
    }
    
    const tokenData = await fs.readFile(tokenPath, 'utf8');
    oauth2Client.setCredentials(JSON.parse(tokenData));

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const fileMetadata = {
      name: `POS_BACKUP_${new Date().toISOString().split('T')[0]}_${originalFileName}`,
    };

    const media = {
      mimeType: 'application/octet-stream', 
      body: fsStream.createReadStream(filePath)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name'
    });

    db.prepare("INSERT INTO sync_logs (sync_type, status, records_processed, error_details) VALUES (?, ?, ?, ?)")
      .run('google_drive_upload', 'SUCCESS', 1, `File ID: ${file.data.id}`);

    return { success: true, fileId: file.data.id };

  } catch (error) {
    console.error("[GOOGLE DRIVE UPLOAD ERROR]:", error);
    db.prepare("INSERT INTO sync_logs (sync_type, status, error_details) VALUES (?, ?, ?)")
      .run('google_drive_upload', 'FAILED', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  googleLogin,
  syncCustomersToGoogle,
  uploadFileToGoogleDrive,
  getDriveSyncStatus,
  toggleDriveSyncStatus
};
