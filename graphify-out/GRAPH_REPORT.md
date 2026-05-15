# Graph Report - barcode-sistem  (2026-05-13)

## Corpus Check
- 92 files · ~1,392,265 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 254 nodes · 200 edges · 14 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `CompanionApiClient` - 17 edges
2. `SyncService` - 10 edges
3. `LingLingRAG` - 9 edges
4. `LingLingDataScience` - 7 edges
5. `App()` - 7 edges
6. `useAuth()` - 7 edges
7. `AnalyticsService` - 5 edges
8. `CashierView()` - 5 edges
9. `ErrorBoundary` - 5 edges
10. `formatRp()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useTransaction()`  [INFERRED]
  src\App.jsx → src\hooks\useTransaction.js
- `CashierView()` --calls--> `useNotify()`  [INFERRED]
  src\components\CashierView.jsx → src\hooks\useNotify.js
- `CashierView()` --calls--> `useLunar()`  [INFERRED]
  src\components\CashierView.jsx → src\hooks\useLunar.js
- `DashboardView()` --calls--> `useAuth()`  [INFERRED]
  src\components\DashboardView.jsx → src\hooks\useAuth.js
- `Sidebar()` --calls--> `useAuth()`  [INFERRED]
  src\components\Sidebar.jsx → src\hooks\useAuth.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (12): CashierView(), DashboardView(), Sidebar(), TransactionProvider(), useTransactionContext(), useAuth(), useLunar(), usePosData() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (1): CompanionApiClient

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (6): PurchasingView(), useNotify(), PosCashier(), History(), LocalIntelligenceDashboard(), formatRp()

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (1): SyncService

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (1): LingLingRAG

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (1): LingLingDataScience

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (3): DeploymentModeScreen(), useDeploymentMode(), App()

### Community 7 - "Community 7"
Cohesion: 0.47
Nodes (3): buildReceiptText(), getPrinterAddress(), printReceipt()

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (1): AnalyticsService

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (1): AuthService

### Community 14 - "Community 14"
Cohesion: 0.6
Nodes (3): applyRounding(), calculateFnBBill(), calculateRetailBill()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (1): BaseClient

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (2): cleanOldBackups(), performBackup()

## Knowledge Gaps
- **Thin community `Community 1`** (18 nodes): `CompanionApiClient`, `.closeSession()`, `.constructor()`, `.createTransaction()`, `.get()`, `.getActiveSession()`, `.getProducts()`, `.getSettings()`, `._initializeModules()`, `.loadConfig()`, `.loginPassword()`, `.loginPin()`, `.openSession()`, `.ping()`, `.post()`, `.saveConfig()`, `.searchProducts()`, `companion-api.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 3`** (11 nodes): `SyncService.js`, `SyncService`, `.authHeaders()`, `.closeSession()`, `.constructor()`, `.createTransaction()`, `.getActiveSession()`, `.getProducts()`, `.getSettings()`, `.openSession()`, `.searchProducts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (10 nodes): `LingLingRAG.js`, `LingLingRAG`, `.askLingLing()`, `.calculateCosineSimilarity()`, `.constructor()`, `.getStoreContext()`, `.ingestDocument()`, `.initDatabase()`, `.loadModel()`, `.splitTextIntoChunks()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (8 nodes): `LingLingDataScience.js`, `LingLingDataScience`, `.calculateLunarBurnRate()`, `.constructor()`, `.getBundlingSuggestion()`, `.getCrossSellRecommendations()`, `.recalculateApriori()`, `.recalculateRFM()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (6 nodes): `AnalyticsService`, `.constructor()`, `.processQueue()`, `.start()`, `.stop()`, `AnalyticsService.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (6 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.constructor()`, `.getDerivedStateFromError()`, `.render()`, `ErrorBoundary.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (5 nodes): `AuthService.js`, `AuthService`, `.constructor()`, `.loginPassword()`, `.loginPin()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (4 nodes): `BaseClient`, `.constructor()`, `.fetchWithResilience()`, `BaseClient.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (3 nodes): `cleanOldBackups()`, `backup.js`, `performBackup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CashierView()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useNotify()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `App()` (e.g. with `usePosData()` and `useSembahyang()`) actually correct?**
  _`App()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._