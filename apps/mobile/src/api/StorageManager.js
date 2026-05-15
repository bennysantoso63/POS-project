import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPANION_CONFIG_KEY = 'companion_config';

/**
 * LING-LING POS - STORAGE MANAGER
 * Fokus: Abstraksi penyimpanan lokal mobile
 */
export const StorageManager = {
  /**
   * Mengambil konfigurasi server pendamping
   */
  async getConfig() {
    try {
      const raw = await AsyncStorage.getItem(COMPANION_CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Gagal membaca storage:", error);
      return null;
    }
  },

  /**
   * Menyimpan konfigurasi server pendamping
   */
  async saveConfig(config) {
    try {
      await AsyncStorage.setItem(COMPANION_CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error("Gagal menulis storage:", error);
      return false;
    }
  },

  /**
   * Menghapus konfigurasi (Reset)
   */
  async clearConfig() {
    await AsyncStorage.removeItem(COMPANION_CONFIG_KEY);
  }
};
