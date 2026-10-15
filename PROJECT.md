# Project: BookShelf Web Application Audit, Optimization & Remediation

## Architecture
- **Framework**: Next.js (App router or Pages router) / React with TypeScript & Tailwind CSS.
- **Backend & Database**: Next.js API Routes, Prisma ORM connecting to Neon PostgreSQL.
- **External Integrations**: Google Gemini API (AI Archivist), Open Library API (book metadata & covers).
- **Core Aesthetic**: Parchment / tactile editorial theme, tactile drawer cards, zero-cost AI archivist desk.
- **Key Routes**:
  - `/` (Home landing: Chapters I-V)
  - `/books` (Catalog search, filters, pagination)
  - `/shelf` (Personal shelf collections and status updates)
  - `/profile` (Reading goals, timeline, statistics)
- **Key API Endpoints**:
  - `/api/archivist/consult` (AI recommendations with caching and Open Library fallback)
  - `/api/books/daily` (Daily curated recommendations)
  - `/api/margin-notes` (Community notes feed and creation)
  - `/api/cover-proxy` (Image proxy and fallback generator)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Chapter I - AI Archivist Desk | Dilemma submission, Gemini recommendations, recommendation cards, fallback, in-memory cache | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 2 | Chapter II - Curator's Shelf | Featured book carousel, book drawer inspection, tactile aesthetic | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 3 | Chapter III - Taste Alchemist | Rhythm frequency filters, catalog queries, zero "Vibe Match" remnants | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 4 | Chapter IV - Margin Notes | Community notes feed, note composition, autofill book metadata from Open Library, omit page number fields | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 5 | Chapter V - Colophon & Footer | Internal links, navigation, responsive parchment layout | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 6 | Route /books | Catalog search, filters, pagination/scroll | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 7 | Route /shelf | Personal shelf collections, reading status updates | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 8 | Route /profile | Reading goals, timeline, reading stats | M1 / M3 | ORIGINAL_REQUEST §R1 |
| 9 | Build & Bundle Optimization | Tree-shaking, chunk optimization, duplicate dependency elimination | M2 / M3 | ORIGINAL_REQUEST §R2 |
| 10 | API Latency & Caching | In-memory cache <20ms, connection pooling, overfetching prevention | M2 / M3 | ORIGINAL_REQUEST §R2 |
| 11 | Rendering & Asset Optimization | DOM weight, CLS, local vs proxied cover images | M2 / M3 | ORIGINAL_REQUEST §R2 |
| 12 | Zero-Cost Guardrails | Minimal live AI calls, free-tier compliance | M2 / M5 | ORIGINAL_REQUEST §R2 |
| 13 | Automated Test Suite | Programmatic verification script across all core endpoints and routes | M4 | ORIGINAL_REQUEST §R3 |
| 14 | Consolidated Audit Report | P50/P95 latencies, bundle size diffs, functional pass rate, recommendations | M5 | ORIGINAL_REQUEST §R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Multi-Agent Survey & Exploration | 3 parallel Explorers for Functional, Performance, and Backend audits | none | DONE |
| M2 | Test Harness & Automation Setup | Test Writer builds verification script and test suite | M1 | DONE |
| M3 | Comprehensive Remediation & Optimization | Worker implements auto-fixes, performance tuning, and clean build | M1, M2 | DONE |
| M4 | Dual Review & Adversarial Stress | 2 Reviewers + 2 Challengers verify functionality, performance, edge cases | M3 | DONE |
| M5 | Forensic Audit & Final Report | Forensic Auditor verifies integrity; Orchestrator compiles final report | M4 | DONE |

## Interface Contracts
### AI Archivist Desk (`/api/archivist/consult`)
- Input: `{ query: string, mood?: string }`
- Output: `{ recommendations: Array<{ title: string, author: string, coverUrl: string, letter: string }>, cached: boolean }`
- Cache SLA: <20ms on hit.

### Margin Notes (`/api/margin-notes`)
- GET: Returns list of notes with attached book title and author.
- POST: `{ bookTitle: string, bookAuthor: string, noteText: string }` (No page number input allowed).

### Cover Proxy (`/api/cover-proxy`)
- Input: `url` query param.
- Output: Image stream or high-fidelity parchment placeholder fallback.

## Code Layout
- `app/` or `pages/`: Route definitions and UI components.
- `components/`: UI modules (ArchivistDesk, CuratorsShelf, TasteAlchemist, MarginNotes, Colophon, BookDrawer, etc.).
- `lib/` or `utils/`: API clients, caching utilities, Gemini wrapper, Open Library client, Prisma client.
- `prisma/`: Prisma schema and migrations.
- `scripts/`: Verification scripts and benchmarks.
- `.agents/teamwork/`: Agent coordination workspaces.
