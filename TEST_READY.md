# TEST_READY: Automated Verification & Latency Audit Suite

**Author**: `test_writer_1` (Specialist / QA)  
**Date**: 2026-10-14  
**Working Directory**: `/Users/kshitijjain/learning/loveable-clone`  
**Target Script**: `scripts/verify-audit.js`  
**NPM Command**: `npm run test:audit`  
**Status**: TEST SUITE READY & VERIFIED

---

## 1. Test Harness Architecture & Deliverables

An opaque-box automated test harness and latency benchmarking engine has been designed and implemented in `scripts/verify-audit.js`. The suite operates without internal code modifications, verifies the running application over HTTP against all interface contracts specified in `PROJECT.md` and `ORIGINAL_REQUEST.md`, and includes a self-healing server lifecycle manager.

### Deliverables Created / Modified
1. `scripts/verify-audit.js`: The standalone test runner and latency profiler (executable via Node 18+).
2. `package.json`: Added `"test:audit": "node scripts/verify-audit.js"` script entry.
3. `audit-report.json`: Machine-readable test execution report automatically exported on each run.
4. `TEST_READY.md`: This comprehensive readiness assessment and defect escalation guide.

### Key Capabilities of `scripts/verify-audit.js`
- **Zero Configuration / Turnkey**: Automatically detects whether Vite dev server is running on `http://localhost:5173`. If offline, spawns the server as a managed child process, waits for socket readiness, executes the test matrix, and performs clean process tree teardown on completion or interrupt.
- **Configurable CLI Flags**:
  - `--url <url>` / `BASE_URL`: Run against custom hosts or ports (e.g., `--url http://localhost:3000`).
  - `--samples <n>`: Set sample count for P50/P95 latency percentiles (default: 10).
  - `--report-only`: Generate full report and metrics while exiting code 0 (for diagnostic CI workflows).
  - `--save-json <path>`: Custom JSON export path.
  - `--verbose`: Detailed stack traces and server stderr streaming.
- **Zero-Cost Free Tier Guardrail**: Restricts live AI queries to minimal priming and enforces strict timeouts (`<2.5s`) on cached/normalized queries, ensuring automated CI runs never trigger runaway external LLM calls or consume Gemini quota.

---

## 2. Test Execution Commands

Run the full verification audit against the local application:

```bash
# Direct node execution
node scripts/verify-audit.js

# Or via npm script
npm run test:audit

# Diagnostic report run (exit code 0 even with failing tests)
node scripts/verify-audit.js --report-only --samples 5

# Custom target URL
node scripts/verify-audit.js --url http://localhost:5173 --verbose
```

---

## 3. Test Coverage Matrix

The suite evaluates 15 rigorous test assertions grouped across 7 domains:

| # | Domain | Test Case | Target Contract / SLA | Status (Pre-Fix) |
|---|--------|-----------|------------------------|------------------|
| 1 | Primary Routes | `GET /` (Home Page) | HTTP 200, `text/html`, `<div id="root">` | **PASS** |
| 2 | Primary Routes | `GET /books` (Catalog Search) | HTTP 200, `text/html`, `<div id="root">` | **PASS** |
| 3 | Primary Routes | `GET /shelf` (Reader Shelf) | HTTP 200, `text/html`, `<div id="root">` | **PASS** |
| 4 | Primary Routes | `GET /profile` (Reader Profile) | HTTP 200, `text/html`, `<div id="root">` | **PASS** |
| 5 | Core API | `GET /api/books/daily` structure | HTTP 200, 30 books, `dateKey`, valid schema | **PASS** |
| 6 | Core API | `GET /api/margin-notes` feed | HTTP 200, `notes` array, required fields | **PASS** |
| 7 | Core API | `GET /api/cover-proxy` valid image | HTTP 200, `image/*` stream, non-zero bytes | **PASS** |
| 8 | Core API | `POST /api/archivist/consult` structure | HTTP 200, 3 recommendations, `cached: boolean` | **FAIL** (Defect 1) |
| 9 | Margin Notes | `POST /api/margin-notes` creation | Subelement `{ bookTitle, bookAuthor, noteText }` succeeds without pageNumber | **FAIL** (Defect 2) |
| 10 | Margin Notes | `POST /api/margin-notes` validation | Empty body `{}` returns HTTP 400 | **PASS** |
| 11 | Cover Proxy | `GET /api/cover-proxy` error fallback | Failing upstream URL returns image/SVG placeholder (not plain text 502/404) | **FAIL** (Defect 3) |
| 12 | Cover Proxy | `GET /api/cover-proxy` validation | Missing `url` parameter returns HTTP 400 | **PASS** |
| 13 | Cache Benchmark | Repeat `POST /api/archivist/consult` | Repeat request resolves in `<20ms` with `cached === true` | **FAIL** (Defect 4) |
| 14 | Cache Benchmark | Normalized query cache hit | Punctuation/whitespace variation resolves from cache with `cached === true` | **FAIL** (Defect 5) |
| 15 | End-to-End | Full lifecycle flow | Consult -> Extract book -> Inscribe note -> Add to shelf -> Verify profile | **FAIL** (Cascaded by Defect 2) |

---

## 4. Baseline Pre-Remediation Audit Results

Running against the pre-remediation codebase produced the following baseline scorecard:

```
==============================================================
                 Audit Verification Scorecard                 
==============================================================

  Total Tests : 15
  Passed      : 9
  Failed      : 6
  Pass Rate   : 60.0%
```

### Latency Benchmark Profiling (ms)

| Endpoint | Samples | Min (ms) | P50 Median (ms) | P95 (ms) | Max (ms) | Target SLA | Current Status |
|---|---|---|---|---|---|---|---|
| `POST /api/archivist/consult` (cached) | 5 | 1.42 | **1.76** | 5.21 | 5.21 | < 20.0 ms | **PASS (<20ms achieved)** |
| `GET /api/books/daily` | 5 | 107.97 | **121.37** | 309.59 | 309.59 | < 20.0 ms | **FAIL (Needs in-memory cache)** |
| `GET /api/margin-notes` | 5 | 201.03 | **207.10** | 216.68 | 216.68 | < 20.0 ms | **FAIL (Needs in-memory cache)** |
| `GET /api/cover-proxy` (fallback) | 5 | 2.36 | **2.88** | 3.19 | 3.19 | < 50.0 ms | **PASS** |

*Note: Repeat `/api/archivist/consult` hits in-memory cache at ~1.76ms (well within the <20ms target), but fails the contract assertion because `cached === true` is missing in the JSON payload.*

---

## 5. Escalated Implementation Defects (For Worker M3)

The test suite surfaced **5 core implementation defects** that the Worker agent (`worker_1` / M3) must remediate:

### Defect 1: Missing `cached: boolean` on `/api/archivist/consult`
- **Location**: `src/server/archivistAiService.ts:12-21, 46-50, 112-117`
- **Observation**: `ArchivistAiResponse` type definition and return values do not include `cached: boolean`.
- **Contract Requirement**: `PROJECT.md:49` requires `{ recommendations: [...], cached: boolean }`.
- **Remediation**: Return `cached: true` on cache hits (line 49) and `cached: false` on fresh generation.

### Defect 2: Rejection of Margin Note Creation Without `passageSnippet`
- **Location**: `src/server/prismaPlugin.ts:421-427`
- **Observation**: Endpoint enforces `if (!bookTitle?.trim() || !passageSnippet?.trim() || !noteText?.trim())` and returns 400.
- **Contract Requirement**: `PROJECT.md:54` and `ORIGINAL_REQUEST.md:41` state: `POST /api/margin-notes with { bookTitle, bookAuthor, noteText }` must succeed without page number or passage snippet requirements.
- **Remediation**: Default `passageSnippet` to a fallback quotation or reflection excerpt if omitted in request payload.

### Defect 3: Cover Proxy Returns Plain Text 502/404 on Upstream Errors
- **Location**: `src/server/prismaPlugin.ts:344-358`
- **Observation**: When upstream fetch fails or returns non-200, code sends `res.end('Upstream error')` or `res.end('Proxy fetch failed')` with plain text content-type.
- **Contract Requirement**: `PROJECT.md:58` and `ORIGINAL_REQUEST.md:47` mandate a valid image stream or high-fidelity parchment SVG placeholder (never broken plain text).
- **Remediation**: Return a parchment-styled SVG placeholder with Content-Type `image/svg+xml`.

### Defect 4: Cache Key Punctuation / Whitespace Normalization
- **Location**: `src/server/archivistAiService.ts:43-45`
- **Observation**: Key normalization is only `rawQuery.trim().toLowerCase()`. Queries like `"warm philosophical fiction !"` miss cache and trigger expensive external Gemini calls.
- **Remediation**: Normalize query by stripping extraneous symbols/punctuation and collapsing whitespace before cache lookup.

### Defect 5: Uncached Neon Database Roundtrips in `/api/books/daily` and `/api/margin-notes`
- **Location**: `src/server/dailyBooksService.ts:210-238` and `src/server/marginNotesService.ts:158-168`
- **Observation**: Every request makes direct network queries to Neon Postgres (~120ms - ~210ms), exceeding the <20ms SLA.
- **Remediation**: Implement in-memory Map caching with TTL or date-key invalidation to achieve sub-millisecond response times on warm lookups.

---

## 6. Verification & Invalidation Criteria

When Worker completes M3 remediations, the full suite can be verified by running:

```bash
node scripts/verify-audit.js
```

**Success Criteria for M3 Completion**:
- Exit code must be `0`.
- Pass rate must be `100%` (15/15 tests passing).
- `cached === true` returned on repeat `/api/archivist/consult`.
- `POST /api/margin-notes` succeeds with `{ bookTitle, bookAuthor, noteText }`.
- `GET /api/cover-proxy?url=invalid` returns valid SVG markup.
- P50 latency for cached consult, daily books, and margin notes is `<20ms`.
