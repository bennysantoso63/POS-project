# Graph Report - barcode-sistem  (2026-05-22)

## Corpus Check
- 90 files · ~1,388,880 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 249 nodes · 190 edges · 15 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `CompanionApiClient` - 17 edges
2. `SyncService` - 10 edges
3. `LingLingDataScience` - 7 edges
4. `useAuth()` - 7 edges
5. `AnalyticsService` - 5 edges
6. `App()` - 5 edges
7. `usePosData()` - 5 edges
8. `CashierView()` - 5 edges
9. `ErrorBoundary` - 5 edges
10. `useNotify()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `AppContent()` --calls--> `useAuth()`  [INFERRED]
  src\App.jsx → src\contexts\AuthContext.jsx
- `AppContent()` --calls--> `useTransactionContext()`  [INFERRED]
  src\App.jsx → src\contexts\TransactionContext.jsx
- `CashierView()` --calls--> `useNotify()`  [INFERRED]
  src\components\CashierView.jsx → src\hooks\useNotify.js
- `CashierView()` --calls--> `useLunar()`  [INFERRED]
  src\components\CashierView.jsx → src\hooks\useLunar.js
- `DashboardView()` --calls--> `useAuth()`  [INFERRED]
  src\components\DashboardView.jsx → src\contexts\AuthContext.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (1): CompanionApiClient

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (6): useAppActions(), usePosData(), useSembahyang(), App(), AppContent(), ErrorBoundary

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (7): CashierView(), DashboardView(), Sidebar(), useAuth(), TransactionProvider(), useTransactionContext(), useLunar()

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (5): HistoryView(), PurchasingView(), RelationsView(), useNotify(), formatRp()

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (1): SyncService

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (1): LingLingDataScience

### Community 6 - "Community 6"
Cohesion: 0.47
Nodes (3): buildReceiptText(), getPrinterAddress(), printReceipt()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (3): DeploymentModeScreen(), useDeploymentMode(), App()

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (1): AnalyticsService

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (2): BrowserMultiFormatReader, NotFoundException

### Community 14 - "Community 14"
Cohesion: 0.4
Nodes (1): AuthService

### Community 15 - "Community 15"
Cohesion: 0.6
Nodes (3): applyRounding(), calculateFnBBill(), calculateRetailBill()

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (1): BaseClient

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (2): cleanOldBackups(), performBackup()

## Knowledge Gaps
- **1 isolated node(s):** `NotFoundException`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (18 nodes): `CompanionApiClient`, `.closeSession()`, `.constructor()`, `.createTransaction()`, `.get()`, `.getActiveSession()`, `.getProducts()`, `.getSettings()`, `._initializeModules()`, `.loadConfig()`, `.loginPassword()`, `.loginPin()`, `.openSession()`, `.ping()`, `.post()`, `.saveConfig()`, `.searchProducts()`, `companion-api.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (11 nodes): `SyncService.js`, `SyncService`, `.authHeaders()`, `.closeSession()`, `.constructor()`, `.createTransaction()`, `.getActiveSession()`, `.getProducts()`, `.getSettings()`, `.openSession()`, `.searchProducts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (8 nodes): `LingLingDataScience.js`, `LingLingDataScience`, `.calculateLunarBurnRate()`, `.constructor()`, `.getBundlingSuggestion()`, `.getCrossSellRecommendations()`, `.recalculateApriori()`, `.recalculateRFM()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (6 nodes): `AnalyticsService`, `.constructor()`, `.processQueue()`, `.start()`, `.stop()`, `AnalyticsService.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (6 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.constructor()`, `.getDerivedStateFromError()`, `.render()`, `ErrorBoundary.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (6 nodes): `BrowserMultiFormatReader`, `.decodeFromVideoElement()`, `.reset()`, `NotFoundException`, `ScannerView()`, `ScannerView.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (5 nodes): `AuthService.js`, `AuthService`, `.constructor()`, `.loginPassword()`, `.loginPin()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `BaseClient`, `.constructor()`, `.fetchWithResilience()`, `BaseClient.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (3 nodes): `cleanOldBackups()`, `backup.js`, `performBackup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CashierView()` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `useNotify()` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `useAuth()` (e.g. with `AppContent()` and `CashierView()`) actually correct?**
  _`useAuth()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NotFoundException` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._