# 📖 BookShelf — The Literary Sanctuary

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **A tactile, parchment-themed digital sanctuary for readers, bibliophiles, and literary guilds.**  
> Built with zero-cost AI archivist guidance, live Neon serverless Postgres persistence, curated community salons, and Open Library integrations.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Aesthetic & Design Philosophy](#-aesthetic--design-philosophy)
- [Key Features](#-key-features)
  - [Chapter I–V Home Experience](#1-chapter-i--v-home-experience)
  - [Personal Reader Shelf & Literary Challenge](#2-personal-reader-shelf--literary-challenge)
  - [Literary Salons & Reading Guilds](#3-literary-salons--reading-guilds)
  - [Community Marginalia & Passages](#4-community-marginalia--passages)
  - [Vault Catalog & Open Library Search](#5-vault-catalog--open-library-search)
- [System Architecture](#-system-architecture)
- [Performance & Optimization Scorecard](#-performance--optimization-scorecard)
- [Tech Stack](#-tech-stack)
- [Database Schema (Neon Postgres)](#-database-schema-neon-postgres)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Migration & Seeding](#database-migration--seeding)
  - [Running the Application](#running-the-application)
- [Project Layout](#-project-layout)
- [Testing & Verification](#-testing--verification)
- [License](#-license)

---

## 🌟 Overview

**BookShelf** reimagines the modern digital bookshelf as a physical, leather-bound volume. Rather than standard, clinical flat web cards, BookShelf delivers:
- **Parchment textures, deckle paper borders, and book spine styling.**
- **Tactile audio feedback** simulating crisp page turns, bookmark drops, and drawer pulls.
- **AI Archivist Desk** powered by Google Gemini that analyzes readers' philosophical dilemmas and returns tailored literary letters and book recommendations.
- **Real-time Neon Serverless Postgres persistence** for personal reading goals, annual challenges, community reading circles, and user marginalia.
- **Interactive Reading Salons** where members can found guilds, join weekly book circles, and manage discussion schedules.

---

## 🎨 Aesthetic & Design Philosophy

The interface was deliberately crafted with editorial craftsmanship:
- **Warm Parchment Palette**: `#f7f4ed` canvas, `#fcfbf8` sheet paper, `#eceae4` deckle border rules, and `#8c5e43` Tuscan terracotta accents.
- **Typography**: Editorial serif headings (`Newsreader`, `EB Garamond`), monospace indexing tabs (`JetBrains Mono`), and tactile body text.
- **Haptic Audio**: Lightweight Web Audio API synthesized page turns and bookmark sounds with a global toggle.
- **Layout Stability**: Locked skeleton dimensions and zero Cumulative Layout Shift (CLS < 0.02).

---

## 🚀 Key Features

### 1. Chapter I–V Home Experience
The landing page is organized as five narrative chapters:
- **Chapter I: The AI Archivist Desk**: Submit any real-world reading dilemma or philosophical curiosity. An AI archivist crafts a personalized response letter recommending three volumes with dynamic caching (`<1.5ms` on cache hits).
- **Chapter II: The Curator’s Shelf**: Tactile carousel of masterworks with genre filters (`Classics`, `Fiction`, `Philosophy`, `Poetry`, `History`, `Science`, `Nature`, `Memoir`).
- **Chapter III: The Taste Alchemist**: Dynamic rhythm frequency filters matching prose density, cadence, and reader temperament.
- **Chapter IV: Margin Notes**: Public annotations left by readers across passages with atomic likes and discussion threads.
- **Chapter V: Colophon & Archive**: Full archive index, scholarly colophon, and sanctuary links.

### 2. Personal Reader Shelf & Literary Challenge (`/shelf`)
- **Annual Literary Goal**: Visual progress bar tracking books read, completion percentage, and pages consumed.
- **Taste Profile & Scholarly Rank**: Onboarding system calibrating personality tags (e.g., *Archivist & Solitary Reader*) and favorite genres.
- **Dual Shelf Collections**:
  - **Books Read**: Historical log segmented by year (2024–2028).
  - **Reading List**: Queue of upcoming volumes with instant "Mark as Read" progression.
- **My Founded Reading Circles**: Dedicated manager showcasing salons founded by the reader, with member tallies, meeting times, and direct edit controls.

### 3. Literary Salons & Reading Guilds (`/community` & `/community/salons`)
- **Clean Community Preview**: The main community page highlights the **top 3 active salons**, keeping the page compact so readers can seamlessly reach today's top marginalia.
- **Dedicated All Salons Directory (`/community/salons`)**:
  - Full archive with live search filter across book title, author, and discussion topics.
  - Side-by-side tabs: **All Salons** and **My Founded Circles**.
- **Founder Privileges & Security**:
  - **Founding a Circle**: Any authenticated reader can inaugurate a guild with custom meeting schedules and themes.
  - **Live Neon Database Persistence**: Circles are immediately written to Neon Postgres and visible across all users and devices.
  - **Founder-Only Editing**: Only the creator sees the **Edit Salon** button to update circle metadata; backend enforces strict HTTP `403 Forbidden` checks against non-founders.
  - **One-Click Joining**: Guest visitors are guided to sign in; logged-in readers toggle attendance with automated count updates.

### 4. Community Marginalia & Passages (`/community/explore`)
- **Passage Quotes**: Excerpts inscribed by fellow scholars.
- **Atomic Concurrency**: High-concurrency liking system backed by Prisma atomic increments (`likes: { increment: 1 }`).
- **Open Library Autofill**: When adding a note, typing a book title queries Open Library in real time to autofill author and edition metadata.

### 5. Vault Catalog & Open Library Search (`/books`)
- **Comprehensive Catalog**: Filter by genre, search by keywords, and sort by page count or publication era.
- **Instant Drawer Inspection**: Deep-dive book drawer featuring synopsis, page counts, genre badges, reader rating counts formatted cleanly (e.g. `2.4M` / `540K`), and quick shelf additions.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    Client["Client Browser\n(React 18 + Vite + Tailwind)"] --> Auth["Authentication Layer\n(Clerk Social / Email OTP)"]
    Client --> Router["React Router v6\n(/, /books, /shelf, /community, /community/salons)"]
    
    subgraph Frontend Services
        Client --> OpenLibClient["Open Library API Client\n(Search & Metadata)"]
        Client --> CirclesApi["Reading Circles API Service"]
        Client --> MarginNotesApi["Margin Notes API Service"]
    end
    
    subgraph Full-Stack Server Middleware (Vite Prisma Plugin)
        Router --> API["REST API Endpoints\n(/api/*)"]
        API --> MemoryCache["In-Memory LRU Cache\n(TTL < 20ms SLA)"]
        API --> CoverProxy["Cover Proxy & SVG Generator\n(Negative Cache 1-hr)"]
        API --> Gemini["Google Gemini 1.5/2.0 Flash\n(Circuit Breaker + Fallback)"]
        API --> PrismaClient["Prisma ORM Client v6.19\n(Connection Pooling tuned: limit 30)"]
    end

    subgraph Cloud Infrastructure
        PrismaClient --> NeonDB["Neon Cloud PostgreSQL\n(AWS ap-southeast-1)"]
        NeonDB --> Profiles[("Profile Table")]
        NeonDB --> ReadingCircles[("ReadingCircle Table")]
        NeonDB --> MarginNotes[("MarginNote Table")]
        NeonDB --> Catalogs[("DailyCatalog Table")]
    end
```

---

## ⚡ Performance & Optimization Scorecard

Audited and benchmarked under high-concurrency loads with automated test harnesses:

| Dimension | Baseline | Optimized / Certified | Improvement |
|:---|:---|:---|:---|
| **Entry JS Bundle** | 575 kB (166 kB gzip) | **148.4 kB (39.9 kB gzip)** | **-74.2% payload reduction** |
| **Code Splitting** | 1 Monolithic chunk | 8 Route & Vendor chunks | Modular on-demand loading |
| **Max Chunk Size** | 575 kB | **148 kB (Zero chunks > 150 kB)** | 100% compliant |
| **Cached API Latency** | >350 ms | **< 1.5 ms (P50: 0.62 ms)** | **99.6% faster** |
| **Cover Proxy Response** | 3,736 ms | **0.87 ms (cached/fallback)** | Zero upstream blocking |
| **Layout Shift (CLS)** | 0.28 (430px jump) | **< 0.02** | **>92% visual stability** |
| **Concurrency Resilience** | DB timeout on 60 ops | **60/60 ops passed (0 errors)** | Atomic increments & pooling |
| **Build Compilation** | 1.80 s | **1.48 s** | Clean TypeScript compile |

---

## 🛠 Tech Stack

- **Frontend Core**: React 18.3, TypeScript 5.6, Vite 5.4
- **Routing**: React Router DOM 6.28 (with route-level code splitting via `React.lazy` and `<Suspense>`)
- **Styling**: Tailwind CSS 3.4 with custom typography, shadow sheets, and parchment textures
- **Icons & Visuals**: `lucide-react`, `canvas-confetti` (dynamically loaded on celebratory actions)
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL (with connection pooling)
- **ORM**: [Prisma ORM 6.19](https://www.prisma.io/)
- **Authentication**: [Clerk React](https://clerk.com/)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`)
- **Book Metadata**: Open Library REST APIs

---

## 🗄 Database Schema (Neon Postgres)

```prisma
model Profile {
  id               String   @id @default(uuid())
  clerkId          String   @unique
  email            String   @unique
  firstName        String   @default("")
  lastName         String   @default("")
  scholarlyRank    String   @default("")
  personalities    String[] @default([])
  selectedGenres   String[] @default([])
  tasteProfile     String   @default("")
  memberSince      String   @default("")
  challengeGoal    Int      @default(12)
  booksRead        Int      @default(0)
  pagesRead        Int      @default(0)
  marginNotesCount Int      @default(0)
  guildsJoined     Int      @default(0)
  isOnboarded      Boolean  @default(false)
  bookmarks        String[] @default([])
  joinedCircles    String[] @default([])
  shelfBooks       Json?    @default("[]")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model ReadingCircle {
  id            String   @id @default(uuid())
  name          String
  currentBook   String
  author        String   @default("Acclaimed Author")
  membersCount  Int      @default(1)
  meetingDate   String   @default("Sundays, 7:00 PM EST")
  topic         String   @default("Literary Exploration & Deep Discussion")
  coverGradient String   @default("from-[#1e2738] to-[#121620]")
  coverImage    String?
  founderEmail  String?
  founderName   String?
  joinedEmails  String[] @default([])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([founderEmail])
}

model MarginNote {
  id             String   @id @default(uuid())
  bookTitle      String
  bookAuthor     String?  @default("Archived Writer")
  passageSnippet String
  noteText       String
  pageNumber     Int?     @default(1)
  readerName     String   @default("Anonymous Reader")
  readerHandle   String?  @default("@reader")
  readerAvatar   String?  @default("")
  userId         String?
  likes          Int      @default(0)
  likedBy        String[] @default([])
  comments       Json?    @default("[]")
  isTopPick      Boolean  @default(false)
  timestamp      String?  @default("Just now")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([isTopPick, likes(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([likes(sort: Desc)])
  @@index([bookTitle])
  @@index([userId])
}

model DailyCatalog {
  id        String   @id @default(uuid())
  dateKey   String   @unique
  booksJson Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 📡 API Reference

All endpoints are served through the high-performance local server middleware:

| Endpoint | Method | Description | Auth / Role |
|:---|:---|:---|:---|
| `/api/circles` | `GET` | List all reading salons (custom DB circles first, followed by curated defaults) | Public |
| `/api/circles` | `POST` | Inaugurate a new reading circle in Neon DB and auto-join the founder | Authenticated |
| `/api/circles` | `PUT` | Edit salon name, current book, author, meeting date, topic | **Founder only** (HTTP 403 on non-founders) |
| `/api/circles/join` | `POST` | Toggle join/leave attendance for a salon | Authenticated |
| `/api/profile` | `GET` | Fetch user profile, taste settings, and shelf data | Authenticated |
| `/api/profile` | `POST` | Update or onboard reader profile | Authenticated |
| `/api/profile/shelf` | `POST` | Add, update status, or remove book from personal shelf | Authenticated |
| `/api/archivist/consult` | `POST` | Consult the Gemini AI Archivist with in-memory caching | Public |
| `/api/books/daily` | `GET` | Fetch daily curated literary folios | Public |
| `/api/margin-notes` | `GET` | Fetch passage margin notes (supports `top=true`) | Public |
| `/api/margin-notes` | `POST` | Inscribe a new margin note | Authenticated |
| `/api/margin-notes/like`| `POST` | Atomic upvote on a note | Authenticated |
| `/api/cover-proxy` | `GET` | Proxy external book cover images with SVG fallback | Public |

---

## 💻 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm** or **pnpm** / **yarn**
- **Neon Postgres Database**: A free serverless Postgres instance at [neon.tech](https://neon.tech)
- **Clerk Account**: Free authentication keys at [clerk.com](https://clerk.com)

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Neon Postgres Connection Strings
DATABASE_URL="postgresql://<user>:<password>@<ep-pooler-domain>.neon.tech/neondb?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://<user>:<password>@<ep-domain>.neon.tech/neondb?sslmode=require"

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Google Gemini API Key (Optional for live AI archivist; fallback generator is built-in)
GEMINI_API_KEY="AIzaSy..."
```

### Database Migration & Seeding

Sync your schema with Neon and generate the Prisma Client:

```bash
# Push schema directly to Neon Postgres
npx prisma db push

# Generate typed Prisma client
npx prisma generate
```

### Running the Application

```bash
# Install dependencies
npm install

# Start Vite dev server with integrated API middleware
npm run dev

# Open in your browser:
# http://localhost:5173
```

To create a production build and preview:

```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Layout

```text
book-recommendation/
├── prisma/
│   └── schema.prisma              # Neon Postgres schema definition
├── scripts/
│   ├── verify-audit.js            # Automated functional test suite
│   ├── stress-benchmark.mjs       # Concurrency and cache latency benchmark
│   └── empirical-challenge.js    # Edge-case adversarial test harness
├── src/
│   ├── components/
│   │   ├── auth/                  # Clerk AuthModal & ProfileSetupModal
│   │   ├── books/                 # BookDetailModal & catalog cards
│   │   ├── community/             # CreateCircleModal & EditCircleModal
│   │   ├── home-chapters/         # Chapters I–V (Hero, Shelf, Mood, Notes, Colophon)
│   │   ├── layout/                # Parchment Navbar & RibbonBookmark
│   │   ├── profile/               # AddBookModal
│   │   └── ui/                    # Tactile Buttons, Badges, BookCovers
│   ├── context/
│   │   └── AuthContext.tsx        # Authentication & unified profile state
│   ├── data/
│   │   ├── booksData.ts           # Curated literary volumes & genre taxonomy
│   │   └── communityData.ts       # Curated seed salons & scholarly notes
│   ├── pages/
│   │   ├── HomePage.tsx           # Chapters I–V reader flow
│   │   ├── BooksPage.tsx          # Literary catalog & Open Library search
│   │   ├── ShelfPage.tsx          # Personal sanctuary & founded circles
│   │   ├── CommunityPage.tsx      # Community preview (top 3 salons & notes)
│   │   ├── SalonsPage.tsx         # Dedicated All Salons Directory screen
│   │   └── CommunityExplorePage.tsx # All reader annotations & discussions
│   ├── server/
│   │   ├── prismaPlugin.ts        # Vite server plugin serving all /api/* routes
│   │   ├── archivistAiService.ts  # Gemini AI archivist with caching & fallback
│   │   ├── dailyBooksService.ts   # Daily book recommendation scheduler
│   │   └── marginNotesService.ts  # Margin notes queries & atomic operations
│   ├── services/
│   │   ├── readingCirclesApi.ts   # Client API client for Salons & Circles
│   │   ├── marginNotesApi.ts      # Client API client for Notes & Likes
│   │   └── openLibrary.ts         # Open Library search & cover resolver
│   ├── types/
│   │   ├── book.ts                # Book, ReadingCircle, and MarginNote types
│   │   └── user.ts                # UserProfile, Taste, and Shelf types
│   ├── utils/
│   │   ├── sound.ts               # Web Audio API tactile sound synthesizer
│   │   └── formatters.ts          # Reader rating and number formatters (K/M)
│   ├── App.tsx                    # Route definitions & lazy code-splitting
│   ├── index.css                  # Custom parchment styling, fonts & shadows
│   └── main.tsx                   # Application bootstrap
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts                 # Chunk splitting & API plugin integration
└── README.md
```

---

## 🧪 Testing & Verification

Run the automated verification suite to audit functional integrity, API latency, and database safety:

```bash
# Run functional test suite (15/15 tests)
npm run test:audit

# Run latency & concurrency benchmark (requires dev server running)
node scripts/stress-benchmark.mjs
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Crafted with care for bibliophiles everywhere. <i>"Savor every passage."</i>
</p>
