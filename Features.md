# POS Mandiri Feature Roadmap

## Sprint 11 — React Native Mobile

### Fase 1: Shared Packages
[x] [11a] packages/core/ — billing, permissions, tax
[x] [11b] packages/db/   — schema, query patterns

### Fase 2: Expo Project
[x] [11c] apps/mobile/package.json + app.json + eas.json

### Fase 3: DB Adapters
[x] [11d] expo-db.js      — SQLite adapter (standalone mode)
[x] [11e] companion-api.js — HTTP client ke Electron (companion mode)
[x] [11f] useDeploymentMode.js — mode selection hook

### Fase 4: Navigation
[x] [11g] AppNavigator.jsx — auth/main stack + bottom tabs

### Fase 5: Core Screens
[x] [11h] DeploymentModeScreen.jsx
[x] [11i] LoginScreen.jsx (PIN + password)
[x] [11j] KasirScreen.jsx (mobile kasir)
[x] [11k] App.jsx entry point

### Fase 6: Remaining Screens + Build
[x] [11l] DashboardScreen.jsx
[x] [11m] InventoryScreen.jsx
[x] [11n] SettingsScreen.jsx
[x] [11o] BarcodeScanner.jsx (expo-camera)
[x] [11p] bluetooth-print.js
[x] [11q] ReceiptModal.jsx
[x] [11r] BUILD.md + EAS config
[x] [11s] Companion REST endpoints di Electron
