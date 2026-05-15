# Build & Distribusi POS Mandiri Mobile

## Prerequisites
- Node.js 20+
- EAS CLI: npm install -g eas-cli
- Expo account: expo.dev

## Install dependencies
cd apps/mobile
npm install

## Development
npx expo start --android   # emulator
npx expo start             # Expo Go (scan QR)

## Build APK (Android sideload)
eas build --platform android --profile preview

## Output
File .apk tersedia di dashboard EAS atau download link.
Distribusi: kirim via WhatsApp, email, atau USB.

## Install di Android
1. Transfer .apk ke HP
2. Settings → Install dari sumber tidak dikenal → Izinkan
3. Tap file .apk → Install

## Companion Mode Setup
1. Buka aplikasi PC → Settings → Companion
2. Tampilkan QR atau salin IP + Token
3. Di HP → Pilih "Hubungkan ke PC Kasir"
4. Input IP, Port (3001), Token
5. Tap Hubungkan
