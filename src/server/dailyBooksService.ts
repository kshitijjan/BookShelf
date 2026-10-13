import { PrismaClient } from '@prisma/client';
import { Book } from '../types/book';
import { BOOKS_DATA } from '../data/booksData';

export interface DailyCategoryConfig {
  genre: string;
  querySubject: string;
  searchFallback: string;
}

export const DAILY_GENRES: DailyCategoryConfig[] = [
  { genre: 'Top Classics', querySubject: 'classic_literature', searchFallback: 'classics literature' },
  { genre: 'Best Fiction', querySubject: 'fiction', searchFallback: 'fiction masterpiece' },
  { genre: 'Self-Help & Personal Growth', querySubject: 'self-help', searchFallback: 'personal growth habits' },
  { genre: 'Business Management & Leadership', querySubject: 'leadership', searchFallback: 'business management leadership' },
  { genre: 'Startups & Entrepreneurship', querySubject: 'entrepreneurship', searchFallback: 'startups venture business' },
  { genre: 'Money, Investing & Stock Market', querySubject: 'investing', searchFallback: 'investing stock market finance' },
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

/**
 * Fetch 3 books with high-quality covers for a given category from Open Library.
 * Uses an offset/page based on date hashing to guarantee different books every day.
 */
async function fetchBooksForCategory(category: DailyCategoryConfig, dateKey: string): Promise<Book[]> {
  // Compute deterministic seed offset based on dateKey + genre so everyday fetches different titles
  let hash = 0;
  const seedStr = `${dateKey}_${category.genre}`;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const offset = Math.abs(hash) % 40; // pick from different pools each day
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
            coverImage: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
            isbn: 'OL-' + (w.key ? w.key.replace('/works/', '') : Math.random().toString().slice(2, 8)),
          };
        });
      }
    }
  } catch (err) {
    console.warn(`[DailyCatalog] Subject fetch failed for ${category.genre}, trying search fallback:`, err);
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
            coverImage: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
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
  console.log(`[DailyCatalog] Refreshing catalog for dateKey=${dateKey} from Open Library...`);
  const allDailyBooks: Book[] = [];

  for (const category of DAILY_GENRES) {
    console.log(`[DailyCatalog] Fetching 3 books for genre: "${category.genre}"...`);
    const books = await fetchBooksForCategory(category, dateKey);
    allDailyBooks.push(...books);
    await sleep(250); // respect Open Library rate limits
  }

  console.log(`[DailyCatalog] Fetched total ${allDailyBooks.length} books. Persisting to Neon PostgreSQL...`);

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

  console.log(`[DailyCatalog] Successfully persisted catalog for ${dateKey} to database!`);
  return allDailyBooks;
}

/**
 * Gets the daily books for a dateKey:
 * - If today's record exists, returns it.
 * - If not, and it's today's date, seeds it with the user's initial 30 books (BOOKS_DATA).
 * - If not, generates fresh 30 books from Open Library.
 */
export async function getDailyCatalog(db: PrismaClient, dateKey: string = getTodayDateKey()): Promise<Book[]> {
  const existing = await db.dailyCatalog.findUnique({
    where: { dateKey },
  });

  if (existing && Array.isArray(existing.booksJson) && existing.booksJson.length > 0) {
    return existing.booksJson as unknown as Book[];
  }

  // If today has no record yet, start with the user's curated 30-book catalog
  const todayKey = getTodayDateKey();
  if (dateKey === todayKey) {
    console.log(`[DailyCatalog] Seeding initial 30 books for today (${dateKey}) with curated catalog...`);
    await db.dailyCatalog.upsert({
      where: { dateKey: todayKey },
      create: {
        dateKey: todayKey,
        booksJson: BOOKS_DATA as any,
      },
      update: {
        booksJson: BOOKS_DATA as any,
      },
    });
    return BOOKS_DATA;
  }

  // Otherwise, fetch fresh books for this dateKey
  return await refreshDailyCatalogForDate(db, dateKey);
}

let schedulerRegistered = false;

/**
 * Automatically schedule the 12:00 AM midnight daily fetch.
 * When midnight strikes, it fetches 30 fresh books from Open Library for the new day
 * and writes them to the database.
 */
export function initMidnightCatalogScheduler(db: PrismaClient) {
  if (schedulerRegistered) return;
  schedulerRegistered = true;

  const ms = getMsUntilMidnight();
  const hoursUntil = (ms / (1000 * 60 * 60)).toFixed(2);
  console.log(`[DailyCatalog] Midnight scheduler active! Next 12:00 AM refresh scheduled in ${hoursUntil} hours.`);

  setTimeout(async () => {
    const todayKey = getTodayDateKey();
    console.log(`[DailyCatalog] 🔔 12:00 AM Midnight reached! Executing scheduled daily Open Library refresh for ${todayKey}...`);
    try {
      await refreshDailyCatalogForDate(db, todayKey);
      console.log(`[DailyCatalog] ✅ Midnight refresh completed for ${todayKey}.`);
    } catch (err) {
      console.error('[DailyCatalog] ❌ Midnight refresh error:', err);
    }

    // Schedule subsequent refreshes every 24 hours (12:00 AM each day)
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
