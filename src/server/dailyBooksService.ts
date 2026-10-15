import { PrismaClient } from '@prisma/client';
import { Book } from '../types/book';
import { BOOKS_DATA } from '../data/booksData';

declare const process: any;

export interface DailyCategoryConfig {
  genre: string;
  querySubject: string;
  searchFallback: string;
}

export const DAILY_GENRES_LIST: string[] = [
  'Top Classics',
  'Best Fiction',
  'Self-Help',
  'Business & Leadership',
  'Startups & Entrepreneurship',
  'Money & Investing',
  'Philosophy',
  'Psychology',
  'Biography & Memoir',
  'Tech & AI',
];

export const DAILY_GENRES: DailyCategoryConfig[] = [
  { genre: 'Top Classics', querySubject: 'classic_literature', searchFallback: 'classics literature' },
  { genre: 'Best Fiction', querySubject: 'fiction', searchFallback: 'fiction masterpiece' },
  { genre: 'Self-Help', querySubject: 'self-help', searchFallback: 'personal growth habits' },
  { genre: 'Business & Leadership', querySubject: 'leadership', searchFallback: 'business management leadership' },
  { genre: 'Startups & Entrepreneurship', querySubject: 'entrepreneurship', searchFallback: 'startups venture business' },
  { genre: 'Money & Investing', querySubject: 'investing', searchFallback: 'investing stock market finance' },
  { genre: 'Philosophy', querySubject: 'philosophy', searchFallback: 'philosophy wisdom' },
  { genre: 'Psychology', querySubject: 'psychology', searchFallback: 'psychology human behavior' },
  { genre: 'Biography & Memoir', querySubject: 'biography', searchFallback: 'biography memoir life' },
  { genre: 'Tech & AI', querySubject: 'artificial_intelligence', searchFallback: 'artificial intelligence computer technology' },
];

const GRADIENTS = [
  'from-[#3a4454] via-[#2a3240] to-[#1c222b]',
  'from-[#705a4f] via-[#4a3b32] to-[#2b211a]',
  'from-[#5d4037] via-[#3e2723] to-[#201410]',
  'from-[#2b253b] via-[#1f192b] to-[#120e1c]',
  'from-[#2e3b32] via-[#202923] to-[#141a16]',
  'from-[#455a64] via-[#2f3e45] to-[#1c252a]',
  'from-[#5c6e58] via-[#3b4738] to-[#20271e]',
  'from-[#8c5e43] via-[#65432f] to-[#3f291c]',
];

export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMsUntilMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let onCatalogRefreshedCallback: ((dateKey: string) => void) | null = null;
export function setCatalogRefreshedCallback(cb: (dateKey: string) => void) {
  onCatalogRefreshedCallback = cb;
}

/**
 * Reliably enriches an array of books with high-resolution cover images from Open Library or local archives.
 * Uses accent normalization, batched queries, smart title matching, and fallback strategies.
 */
export async function enrichBooksWithCovers(books: Book[]): Promise<Book[]> {
  const BATCH_SIZE = 4;
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (book) => {
        if (book.coverImage) return;

        // 1. Check local static books first
        const local = BOOKS_DATA.find(
          (b) => b.title.toLowerCase().trim() === book.title.toLowerCase().trim()
        );
        if (local?.coverImage) {
          book.coverImage = local.coverImage;
          return;
        }

        const mainTitle = book.title.split(/[:\-–—]/)[0].trim();
        const cleanAuthor = (book.author || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // 2. Primary: query Open Library by title and author with limit=5
        try {
          const q = cleanAuthor ? `${mainTitle} ${cleanAuthor}` : mainTitle;
          const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=title,author_name,cover_i,number_of_pages_median,first_publish_year`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 7000);
          const olRes = await fetch(olUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'BookshelfApp/1.0 (daily-catalog-ai)' },
          });
          clearTimeout(timeout);

          if (olRes.ok) {
            const olData = await olRes.json();
            const docs = olData.docs || [];
            const match = docs.find((d: any) => d.cover_i && d.title?.toLowerCase().includes(mainTitle.toLowerCase()))
                       || docs.find((d: any) => d.cover_i);

            if (match?.cover_i) {
              book.coverImage = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`)}`;
              if (match.number_of_pages_median && (!book.pages || book.pages === 320)) {
                book.pages = match.number_of_pages_median;
              }
              if (match.first_publish_year && (!book.year || book.year === 2020)) {
                book.year = match.first_publish_year;
              }
              return;
            }
          }
        } catch {
          // Gracefully continue to fallback
        }

        // 3. Fallback: query Open Library by title only
        try {
          const olUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(mainTitle)}&limit=5&fields=title,cover_i,number_of_pages_median,first_publish_year`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const olRes = await fetch(olUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'BookshelfApp/1.0 (daily-catalog-ai)' },
          });
          clearTimeout(timeout);

          if (olRes.ok) {
            const olData = await olRes.json();
            const docs = olData.docs || [];
            const match = docs.find((d: any) => d.cover_i);
            if (match?.cover_i) {
              book.coverImage = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`)}`;
              if (match.number_of_pages_median && (!book.pages || book.pages === 320)) {
                book.pages = match.number_of_pages_median;
              }
              if (match.first_publish_year && (!book.year || book.year === 2020)) {
                book.year = match.first_publish_year;
              }
            }
          }
        } catch {
          // Gracefully continue with rich gradient cover
        }
      })
    );
  }
  return books;
}

/**
 * Calls Google Gemini (Free-Tier Flash models) to curate 30 celebrated bestsellers
 * (exactly 3 books per row for each of the 10 defined genres).
 */
async function fetchDailyBooksFromAi(dateKey: string): Promise<Book[] | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) return null;

  // Use the 100% free-tier 1,500 RPD Flash models
  const models = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ];

  const prompt = `You are the Master Literary Curator for BookShelf.
Every day at 12:00 AM Midnight, you curate the 30 definitive masterworks for our 10 literary shelves for date: ${dateKey}.
For EACH of the following 10 genres, select exactly THREE (3) internationally acclaimed, high-rating (4.5+ stars), best-selling, widely reviewed books.
Do NOT choose obscure or random books. Only choose iconic bestsellers, modern essentials, award winners, and beloved classics.

The 10 genres are:
${DAILY_GENRES_LIST.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Return ONLY a valid JSON object matching this schema:
{
  "curationDate": "${dateKey}",
  "genres": [
    {
      "genre": "Genre Name",
      "books": [
        {
          "title": "Exact Title",
          "author": "Author Name",
          "rating": 4.8,
          "reviewCount": 15000,
          "pages": 320,
          "year": 2018,
          "synopsis": "Original 1-sentence hook in your own words describing the book theme.",
          "whyYouWillLoveIt": "1 sentence why it is an essential bestseller in this genre."
        }
      ]
    }
  ]
}`;

  for (const model of models) {
    try {
      console.log(`[DailyCatalogAI] Calling Gemini model ${model} for midnight 12:00 AM refresh (${dateKey})...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[DailyCatalogAI] Gemini model ${model} returned HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.genres) && parsed.genres.length >= 10) {
        const allBooks: Book[] = [];
        let bookIdx = 0;

        for (const g of parsed.genres) {
          const genreName = g.genre;
          const genreBooks = (g.books || []).slice(0, 3);

          for (const b of genreBooks) {
            bookIdx++;
            allBooks.push({
              id: `ai-daily-${dateKey}-${genreName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${bookIdx}`,
              title: b.title,
              author: b.author,
              year: b.year || 2020,
              rating: typeof b.rating === 'number' ? Number(b.rating.toFixed(2)) : 4.85,
              reviewCount: b.reviewCount || 12000,
              pages: b.pages || 320,
              genre: genreName,
              secondaryGenre: `${genreName} Bestseller`,
              synopsis: b.synopsis || `An extraordinary, acclaimed bestseller in ${genreName}.`,
              quote: b.synopsis || `“A transformative work that redefines our understanding of ${genreName.toLowerCase()}.”`,
              whyYouWillLoveIt: b.whyYouWillLoveIt || `Curated as an essential bestseller in ${genreName} for today's vault.`,
              moodTags: [genreName, 'AI Bestseller', 'Daily Vault'],
              coverGradient: GRADIENTS[bookIdx % GRADIENTS.length],
              coverTextColor: '#f7f4ed',
              isbn: 'AI-D-' + Math.random().toString().slice(2, 10),
            });
          }
        }

        // Enrich with real book covers reliably in batches
        await enrichBooksWithCovers(allBooks);

        console.log(`[DailyCatalogAI] Successfully generated & enriched 30 AI bestsellers across 10 genres for ${dateKey}!`);
        return allBooks;
      }
    } catch (err) {
      console.warn(`[DailyCatalogAI] Error on model ${model}:`, err);
      continue;
    }
  }

  return null;
}

/**
 * Fetch 3 books with high-quality covers for a given category from Open Library (secondary fallback).
 */
async function fetchBooksForCategory(category: DailyCategoryConfig, dateKey: string): Promise<Book[]> {
  let hash = 0;
  const seedStr = `${dateKey}_${category.genre}`;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const offset = Math.abs(hash) % 40;
  const page = (Math.abs(hash) % 6) + 1;

  // 1. Try Open Library subjects API
  try {
    const subjectUrl = `https://openlibrary.org/subjects/${category.querySubject}.json?limit=25&offset=${offset}`;
    const res = await fetch(subjectUrl, { headers: { 'User-Agent': 'BookshelfApp/1.0 (daily-catalog)' } });
    if (res.ok) {
      const data = await res.json();
      const works = data.works || [];
      const booksWithCover = works.filter((w: any) => !!(w.cover_id || w.cover_i));
      
      if (booksWithCover.length >= 3) {
        return booksWithCover.slice(0, 3).map((w: any, idx: number) => {
          const coverId = w.cover_id || w.cover_i;
          const author = w.authors?.[0]?.name || 'Acclaimed Author';
          const title = w.title || 'Untitled Work';
          const year = w.first_publish_year || 2020;
          const subjects = (w.subject || []).filter((s: any) => typeof s === 'string').slice(0, 3);
          const firstSentence = typeof w.first_sentence === 'string' ? w.first_sentence : w.first_sentence?.[0];

          return {
            id: `ol-${dateKey}-${category.genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx + 1}`,
            title,
            author,
            year,
            rating: Number((4.6 + Math.random() * 0.35).toFixed(2)),
            reviewCount: Math.floor(Math.random() * 4000) + 1200,
            pages: Math.floor(Math.random() * 250) + 200,
            genre: category.genre,
            secondaryGenre: subjects[0] || category.genre,
            synopsis: firstSentence || `An extraordinary, thought-provoking masterwork exploring ${category.genre.toLowerCase()}, penned with profound clarity.`,
            quote: firstSentence || `In every era, great minds turn to ${category.genre.toLowerCase()} to distill the core of the human condition.`,
            whyYouWillLoveIt: `Recommended for today's daily vault: an essential reading in ${category.genre} that expands horizons and sparks deep reflection.`,
            moodTags: subjects.length > 0 ? subjects : [category.genre, 'Daily Archive'],
            coverGradient: GRADIENTS[(Math.abs(hash) + idx) % GRADIENTS.length],
            coverTextColor: '#f7f4ed',
            coverImage: `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`)}`,
            isbn: 'OL-' + (w.key ? w.key.replace('/works/', '') : Math.random().toString().slice(2, 8)),
          };
        });
      }
    }
  } catch (err) {
    console.warn(`[DailyCatalog] Subject fetch failed for ${category.genre}:`, err);
  }

  // 2. Fallback to Open Library search API with fields
  try {
    const fields = 'key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,number_of_pages_median,subject,first_sentence';
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(category.searchFallback)}&page=${page}&limit=15&fields=${fields}`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'BookshelfApp/1.0 (daily-catalog)' } });
    if (res.ok) {
      const data = await res.json();
      const docs = data.docs || [];
      const docsWithCover = docs.filter((d: any) => !!d.cover_i);

      if (docsWithCover.length >= 3) {
        return docsWithCover.slice(0, 3).map((d: any, idx: number) => {
          const coverId = d.cover_i;
          const author = d.author_name?.[0] || 'Acclaimed Author';
          const title = d.title || 'Untitled Work';
          const year = d.first_publish_year || 2021;
          const subjects = (d.subject || []).filter((s: any) => typeof s === 'string').slice(0, 3);
          const firstSentence = typeof d.first_sentence === 'string' ? d.first_sentence : d.first_sentence?.[0];

          return {
            id: `ol-${dateKey}-${category.genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx + 1}`,
            title,
            author,
            year,
            rating: Number((4.6 + Math.random() * 0.35).toFixed(2)),
            reviewCount: d.ratings_count || Math.floor(Math.random() * 4000) + 1200,
            pages: d.number_of_pages_median || Math.floor(Math.random() * 250) + 200,
            genre: category.genre,
            secondaryGenre: subjects[0] || category.genre,
            synopsis: firstSentence || `An extraordinary, thought-provoking masterwork exploring ${category.genre.toLowerCase()}, penned with profound clarity.`,
            quote: firstSentence || `In every era, great minds turn to ${category.genre.toLowerCase()} to distill the core of the human condition.`,
            whyYouWillLoveIt: `Recommended for today's daily vault: an essential reading in ${category.genre} that expands horizons and sparks deep reflection.`,
            moodTags: subjects.length > 0 ? subjects : [category.genre, 'Daily Archive'],
            coverGradient: GRADIENTS[(Math.abs(hash) + idx) % GRADIENTS.length],
            coverTextColor: '#f7f4ed',
            coverImage: `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`)}`,
            isbn: 'OL-' + (d.key ? d.key.replace('/works/', '') : Math.random().toString().slice(2, 8)),
          };
        });
      }
    }
  } catch (err) {
    console.error(`[DailyCatalog] Search fallback failed for ${category.genre}:`, err);
  }

  // 3. Fallback: filter from curated BOOKS_DATA for this genre
  const curated = BOOKS_DATA.filter((b) => b.genre.toLowerCase() === category.genre.toLowerCase());
  if (curated.length >= 3) {
    return curated.slice(0, 3);
  }
  return BOOKS_DATA.slice(0, 3);
}

/**
 * Generates and saves a full 30-book daily catalog (10 categories × 3 books each)
 * for the given dateKey into Neon Postgres via Prisma.
 */
export async function refreshDailyCatalogForDate(db: PrismaClient, dateKey: string): Promise<Book[]> {
  console.log(`[DailyCatalog] Initiating 12:00 AM refresh for dateKey=${dateKey}...`);
  
  // 1. Primary: Curate 30 bestsellers using Gemini AI
  const aiBooks = await fetchDailyBooksFromAi(dateKey);
  let allDailyBooks: Book[] = [];

  if (aiBooks && aiBooks.length >= 30) {
    allDailyBooks = aiBooks;
    console.log(`[DailyCatalog] AI Curation successful! 30 books generated for ${dateKey}.`);
  } else {
    console.log(`[DailyCatalog] AI unavailable, falling back to Open Library subject discovery for ${dateKey}...`);
    for (const category of DAILY_GENRES) {
      const books = await fetchBooksForCategory(category, dateKey);
      allDailyBooks.push(...books);
      await sleep(200);
    }
  }

  // 2. Persist to Neon PostgreSQL via Prisma
  await db.dailyCatalog.upsert({
    where: { dateKey },
    create: {
      dateKey,
      booksJson: allDailyBooks as any,
    },
    update: {
      booksJson: allDailyBooks as any,
    },
  });

  // 3. Update in-memory caches
  dailyCatalogCache.set(dateKey, { timestamp: Date.now(), books: allDailyBooks });
  if (onCatalogRefreshedCallback) {
    onCatalogRefreshedCallback(dateKey);
  }

  console.log(`[DailyCatalog] Successfully persisted 30 books for ${dateKey} to Neon PostgreSQL!`);
  return allDailyBooks;
}

// In-memory cache for daily catalog
const dailyCatalogCache = new Map<string, { timestamp: number; books: Book[] }>();
const DAILY_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function invalidateDailyCatalogCache() {
  dailyCatalogCache.clear();
}

/**
 * Gets the daily books for a dateKey:
 * - If in-memory cache hit, returns in <1ms.
 * - If today's record exists in DB with 30 AI books, caches and returns it.
 * - If not, generates fresh 30 books via AI and persists them.
 */
export async function getDailyCatalog(db: PrismaClient, dateKey: string = getTodayDateKey()): Promise<Book[]> {
  // 1. In-memory cache hit (< 1ms SLA)
  const cached = dailyCatalogCache.get(dateKey);
  if (cached && Date.now() - cached.timestamp < DAILY_CACHE_TTL_MS) {
    return cached.books;
  }

  // 2. Database query with selective projection
  const existing = await db.dailyCatalog.findUnique({
    where: { dateKey },
    select: { booksJson: true },
  });

  if (existing && Array.isArray(existing.booksJson) && existing.booksJson.length >= 30) {
    // If it's already an AI-curated catalog or genuine daily catalog, serve it
    const firstId = (existing.booksJson[0] as any)?.id || '';
    if (firstId.startsWith('ai-daily-') || firstId.startsWith('ol-')) {
      let books = existing.booksJson as unknown as Book[];
      const missingCovers = books.filter((b) => !b.coverImage);
      if (missingCovers.length > 0) {
        console.log(`[DailyCatalog] Auto-healing ${missingCovers.length} missing covers in ${dateKey} catalog...`);
        books = await enrichBooksWithCovers(books);
        await db.dailyCatalog.update({
          where: { dateKey },
          data: { booksJson: books as any },
        });
        console.log(`[DailyCatalog] ✅ Auto-healed and persisted covers for ${dateKey}!`);
        if (onCatalogRefreshedCallback) {
          onCatalogRefreshedCallback(dateKey);
        }
      }
      dailyCatalogCache.set(dateKey, { timestamp: Date.now(), books });
      return books;
    }
  }

  // 3. Not yet generated with AI or contains old static seed: Generate fresh AI catalog
  console.log(`[DailyCatalog] Generating fresh AI-curated catalog for ${dateKey}...`);
  const freshBooks = await refreshDailyCatalogForDate(db, dateKey);
  return freshBooks;
}

let schedulerRegistered = false;

/**
 * Automatically schedule the 12:00 AM midnight daily AI fetch.
 * When midnight strikes, it generates 30 fresh bestselling books via AI for the new day
 * and writes them to Neon PostgreSQL.
 */
export function initMidnightCatalogScheduler(db: PrismaClient) {
  if (schedulerRegistered) return;
  schedulerRegistered = true;

  const ms = getMsUntilMidnight();
  const hoursUntil = (ms / (1000 * 60 * 60)).toFixed(2);
  console.log(`[DailyCatalog] Midnight 12:00 AM scheduler active! Next refresh scheduled in ${hoursUntil} hours.`);

  // Auto-schedule at 12:00 AM sharp
  setTimeout(async () => {
    const todayKey = getTodayDateKey();
    console.log(`[DailyCatalog] 🔔 12:00 AM Midnight reached! Executing scheduled AI daily refresh for ${todayKey}...`);
    try {
      await refreshDailyCatalogForDate(db, todayKey);
      console.log(`[DailyCatalog] ✅ 12:00 AM AI Midnight refresh completed successfully for ${todayKey}!`);
    } catch (err) {
      console.error('[DailyCatalog] ❌ Midnight refresh error:', err);
    }

    // Schedule subsequent refreshes every 24 hours at 12:00 AM
    setInterval(async () => {
      const nextKey = getTodayDateKey();
      console.log(`[DailyCatalog] 🔔 12:00 AM Daily refresh executing for ${nextKey}...`);
      try {
        await refreshDailyCatalogForDate(db, nextKey);
      } catch (err) {
        console.error('[DailyCatalog] ❌ Recurring daily refresh error:', err);
      }
    }, 24 * 60 * 60 * 1000);
  }, ms);
}
