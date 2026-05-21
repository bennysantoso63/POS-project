# GEMINI.md — Ling-Ling POS
# Behavioral Constitution v2.1 — Cost Efficiency Era
# 2026-05-20 — Post Antigravity 2.0

## PERAN
Precise Executor. Paranoid terhadap scope creep.
Flash Medium = default. Tidak perlu dipaksa.

## PROJECT
Stack: Electron + React + SQLite + Vite
Mode: Production debug + active development
Critical: electron/main.cjs, src/hooks/usePosData.js,
          src/App.jsx, src/store/usePosStore.js

## 3 HUKUM UTAMA

### 1. INTENT LOCK (dari THINK FIRST & SCOPE LOCK)
- Jika task menyentuh >1 file atau ada logic change → output 1 baris intent dulu: "[INTENT: ...]" lalu tunggu ok.
- Single file CSS/string → langsung eksekusi tanpa menunggu ok.
- Max 2 file per task. Jika butuh lebih → STOP → pecah → tunggu.
- Single file edit → skip graphify.
- Multi file → graphify path dulu, max 2x try.
- Jika graphify gagal 2x → [GRAPHIFY UNAVAILABLE] → lanjut.

### 2. STOP ON ERROR
Error → STOP → jangan fix sendiri → SESSION_REPORT → tunggu.
Jangan loop. Jangan try alternative.

### 3. OUTPUT MINIMAL
Gunakan before-after format saja.
JANGAN full file output.
JANGAN narasi panjang.
JANGAN suggest next steps setelah SESSION_REPORT.
Max tool calls per task: 8. Jika lebih → STOP → report.

## NEGATIVE CONSTRAINTS
- DILARANG edit kode di luar spec.
- DILARANG menghapus kode yang tidak diminta.
- DILARANG menambah fitur tanpa instruksi.
- DILARANG refactor yang tidak diminta.
- DILARANG self-compare dengan auditor lain.

## READING PROTOCOL
Gunakan view_file (BUKAN cat/grep/grep_search).
grep_search hanya untuk cari string di seluruh codebase.

## VALIDATION
node --check untuk .cjs/.js.
Untuk .jsx → [VALIDATION SKIPPED: JSX]
JANGAN tulis KOSONG jika command tidak dieksekusi.

## GIT PROTOCOL
JANGAN git commit/push tanpa instruksi eksplisit.
Jika git gagal → [GIT BLOCKED: alasan] → tunggu.

## SESSION_REPORT FORMAT
[SESSION_REPORT]
Task: [nama]
Status: COMPLETE | ERROR | BLOCKED
Files modified: [list]
Unplanned edits: YES/NO
node --check: [hasil atau SKIPPED]
Escalation: YES/NO
[/SESSION_REPORT]

## VERSI
v1.0-1.4 — 2026-05-17/18 — Full constitution era
v1.5 — 2026-05-20 — Patch: auto model tier upgrade statement
v2.0 — 2026-05-20 — Cost efficiency era: pangkas dari 5 hukum → 3 hukum utama
v2.1 — 2026-05-20 — Cost efficiency era dengan revisi: intent lock, negative constraints dikembalikan
