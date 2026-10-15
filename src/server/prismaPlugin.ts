import { Plugin } from 'vite';
import { PrismaClient } from '@prisma/client';
import {
  getDailyCatalog,
  refreshDailyCatalogForDate,
  initMidnightCatalogScheduler,
  setCatalogRefreshedCallback,
  getTodayDateKey,
  getTomorrowDateKey,
  getMsUntilMidnight,
} from './dailyBooksService';
import {
  getTopMarginNotes,
  getAllMarginNotes,
  invalidateTopNotesCache,
} from './marginNotesService';
import { getArchivistAiRecommendations } from './archivistAiService';
import { BOOKS_DATA } from '../data/booksData';
import { READING_CIRCLES_DATA } from '../data/communityData';


declare const process: any;
declare const Buffer: any;
type Buffer = any;

try {
  if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // ignore if already loaded or missing
}

function getTunedDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) return '';
  try {
    const u = new URL(dbUrl);
    u.searchParams.set('connection_limit', '30');
    u.searchParams.set('pool_timeout', '20');
    u.searchParams.set('pgbouncer', 'true');
    return u.toString();
  } catch {
    const sep = dbUrl.includes('?') ? '&' : '?';
    return `${dbUrl}${sep}connection_limit=30&pool_timeout=20&pgbouncer=true`;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma || !(globalForPrisma.prisma as any).readingCircle) {
    const tunedUrl = getTunedDatabaseUrl();
    if (tunedUrl) {
      process.env.DATABASE_URL = tunedUrl;
    }
    globalForPrisma.prisma = new PrismaClient({
      datasources: tunedUrl ? { db: { url: tunedUrl } } : undefined,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

interface CachedCover {
  buffer: Buffer;
  contentType: string;
  timestamp: number;
  ttl?: number;
}
const coverCache = new Map<string, CachedCover>();
const COVER_CACHE_MAX_ENTRIES = 500;
const COVER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1000;
const serializedDailyCache = new Map<string, { timestamp: number; buffer: Buffer }>();
const coverLookupCache = new Map<string, string | null>();

function generateParchmentSvgFallback(title: string = 'Archived Volume'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
    <rect width="300" height="450" fill="#f4efe6" rx="4"/>
    <rect x="8" y="8" width="284" height="434" fill="none" stroke="#d5cdbe" stroke-width="1.5" stroke-dasharray="4 2"/>
    <rect x="16" y="16" width="268" height="418" fill="none" stroke="#e8e2d5" stroke-width="1"/>
    <path d="M24 0 L24 450" stroke="#d5cdbe" stroke-width="2"/>
    <circle cx="150" cy="180" r="36" fill="#8c5e43" opacity="0.12"/>
    <path d="M140 170 L150 160 L160 170 L150 180 Z" fill="#8c5e43"/>
    <text x="150" y="240" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#2b211a" text-anchor="middle" letter-spacing="1">BOOKSHELF SANCTUARY</text>
    <text x="150" y="265" font-family="Georgia, serif" font-size="11" fill="#705a4f" text-anchor="middle" font-style="italic">${title}</text>
    <line x1="80" y1="285" x2="220" y2="285" stroke="#d5cdbe" stroke-width="0.75"/>
  </svg>`;
}

export function prismaApiPlugin(): Plugin {
  return {
    name: 'prisma-api-plugin',
    configureServer(server) {
      // Connect cache invalidation when catalog refreshes (midnight scheduler or manual trigger)
      setCatalogRefreshedCallback((dateKey: string) => {
        serializedDailyCache.delete(dateKey);
        console.log(`[PrismaPlugin] Serialized cache invalidated for ${dateKey}`);
      });

      // Initialize midnight scheduler on server boot
      try {
        initMidnightCatalogScheduler(getPrisma());
      } catch (err) {
        console.error('[PrismaPlugin] Failed to initialize midnight catalog scheduler:', err);
      }

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url || '/', 'http://localhost');

        if (url.pathname === '/api/profile') {
          const db = getPrisma();

          // GET /api/profile?clerkId=... or ?email=...
          if (req.method === 'GET') {
            const clerkId = url.searchParams.get('clerkId');
            const email = url.searchParams.get('email');
            console.log(`[API /api/profile GET] clerkId=${clerkId} email=${email}`);

            if (!clerkId && !email) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing clerkId or email' }));
              return;
            }

            try {
              const conditions: any[] = [];
              if (clerkId) conditions.push({ clerkId });
              if (email) conditions.push({ email });

              const profile = await db.profile.findFirst({
                where: {
                  OR: conditions,
                },
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ profile }));
            } catch (err: any) {
              console.error('Error fetching profile from Prisma:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Database query failed' }));
            }
            return;
          }

          // POST /api/profile (create or update profile)
          if (req.method === 'POST') {
            try {
              const body = await parseJsonBody(req);
              const identifier = body.clerkId || body.email;
              console.log(`[API /api/profile POST] saving identifier=${identifier} name=${body.firstName} ${body.lastName}`);

              if (!identifier) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing clerkId or email' }));
                return;
              }

              // Check if profile exists by clerkId or by email
              let existing = null;
              if (body.clerkId) {
                existing = await db.profile.findFirst({ where: { clerkId: body.clerkId } });
              }
              if (!existing && body.email) {
                existing = await db.profile.findFirst({ where: { email: body.email } });
              }

              let profile;
              if (existing) {
                profile = await db.profile.update({
                  where: { id: existing.id },
                  data: {
                    clerkId: body.clerkId || existing.clerkId,
                    email: body.email || existing.email,
                    firstName: body.firstName !== undefined ? body.firstName : existing.firstName,
                    lastName: body.lastName !== undefined ? body.lastName : existing.lastName,
                    scholarlyRank: body.scholarlyRank !== undefined ? body.scholarlyRank : existing.scholarlyRank,
                    personalities: body.personalities !== undefined ? body.personalities : existing.personalities,
                    selectedGenres: body.selectedGenres !== undefined ? body.selectedGenres : existing.selectedGenres,
                    tasteProfile: body.tasteProfile !== undefined ? body.tasteProfile : existing.tasteProfile,
                    memberSince: body.memberSince || existing.memberSince,
                    challengeGoal: body.challengeGoal !== undefined ? body.challengeGoal : existing.challengeGoal,
                    booksRead: body.booksRead !== undefined ? body.booksRead : existing.booksRead,
                    pagesRead: body.pagesRead !== undefined ? body.pagesRead : existing.pagesRead,
                    marginNotesCount: body.marginNotesCount !== undefined ? body.marginNotesCount : existing.marginNotesCount,
                    guildsJoined: body.guildsJoined !== undefined ? body.guildsJoined : existing.guildsJoined,
                    isOnboarded: body.isOnboarded !== undefined ? body.isOnboarded : true,
                    bookmarks: body.bookmarks !== undefined ? body.bookmarks : existing.bookmarks,
                    joinedCircles: body.joinedCircles !== undefined ? body.joinedCircles : existing.joinedCircles,
                    shelfBooks: body.shelfBooks !== undefined ? body.shelfBooks : existing.shelfBooks,
                  },
                });
              } else {
                profile = await db.profile.create({
                  data: {
                    clerkId: body.clerkId || body.email || `clerk_${Date.now()}`,
                    email: body.email || body.clerkId || `user_${Date.now()}@bookshelf.sanctuary`,
                    firstName: body.firstName || '',
                    lastName: body.lastName || '',
                    scholarlyRank: body.scholarlyRank || 'Bibliophile Scholar',
                    personalities: body.personalities || [],
                    selectedGenres: body.selectedGenres || [],
                    tasteProfile: body.tasteProfile || '',
                    memberSince: body.memberSince || '',
                    challengeGoal: body.challengeGoal ?? 12,
                    booksRead: body.booksRead ?? 0,
                    pagesRead: body.pagesRead ?? 0,
                    marginNotesCount: body.marginNotesCount ?? 0,
                    guildsJoined: body.guildsJoined ?? 0,
                    isOnboarded: body.isOnboarded !== undefined ? body.isOnboarded : true,
                    bookmarks: body.bookmarks || [],
                    joinedCircles: body.joinedCircles || [],
                    shelfBooks: body.shelfBooks || [],
                  },
                });
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ profile }));
            } catch (err: any) {
              console.error('Error saving profile to Prisma:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to persist profile', details: err?.message }));
            }
            return;
          }
        }

        // POST /api/profile/shelf (Add, update, or remove books from user's shelf)
        if (url.pathname === '/api/profile/shelf') {
          const db = getPrisma();
          if (req.method === 'POST') {
            try {
              const body = await parseJsonBody(req);
              const identifier = body.clerkId || body.email;
              if (!identifier) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing clerkId or email' }));
                return;
              }

              let existing = null;
              if (body.clerkId) existing = await db.profile.findFirst({ where: { clerkId: body.clerkId } });
              if (!existing && body.email) existing = await db.profile.findFirst({ where: { email: body.email } });

              if (!existing) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Profile not found' }));
                return;
              }

              let currentShelf: any[] = Array.isArray(existing.shelfBooks) ? (existing.shelfBooks as any[]) : [];
              const { action, book, status, yearRead } = body;

              if (action === 'add' || action === 'update') {
                // Remove existing if present to avoid duplicates
                currentShelf = currentShelf.filter((item) => item.book?.id !== book.id && item.bookId !== book.id);
                currentShelf.unshift({
                  book,
                  status: status || 'read', // 'read' | 'reading_list'
                  yearRead: status === 'read' ? (yearRead || new Date().getFullYear()) : undefined,
                  dateAdded: new Date().toISOString(),
                });
              } else if (action === 'remove') {
                currentShelf = currentShelf.filter((item) => item.book?.id !== book?.id && item.bookId !== book?.id && item.book?.id !== body.bookId && item.bookId !== body.bookId);
              }

              // Calculate metrics
              const readBooks = currentShelf.filter((item) => item.status === 'read');
              const totalPages = readBooks.reduce((sum, item) => sum + (Number(item.book?.pages) || 0), 0);
              const currentYear = new Date().getFullYear();
              const readThisYear = readBooks.filter((item) => item.yearRead === currentYear);

              const updatedProfile = await db.profile.update({
                where: { id: existing.id },
                data: {
                  shelfBooks: currentShelf,
                  pagesRead: totalPages,
                  booksRead: readThisYear.length,
                },
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ profile: updatedProfile, shelfBooks: currentShelf }));
            } catch (err: any) {
              console.error('Error updating shelf:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to update shelf', details: err?.message }));
            }
            return;
          }
        }

        // GET /api/circles (List all reading circles)
        if (url.pathname === '/api/circles' && req.method === 'GET') {
          const db = getPrisma();
          try {
            const dbCircles = await db.readingCircle.findMany({
              orderBy: { createdAt: 'desc' },
            });
            const dbIds = new Set(dbCircles.map((c) => c.id));
            const nonDupeSeed = READING_CIRCLES_DATA.filter((c) => !dbIds.has(c.id));
            const circles = [...dbCircles, ...nonDupeSeed];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ circles }));
          } catch (err: any) {
            console.error('Error fetching circles from database:', err);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ circles: READING_CIRCLES_DATA }));
          }
          return;
        }

        // POST /api/circles (Found a new reading circle)
        if (url.pathname === '/api/circles' && req.method === 'POST') {
          const db = getPrisma();
          try {
            const body = await parseJsonBody(req);
            const { name, currentBook, author, meetingDate, topic, coverGradient, founderEmail, founderName } = body;
            if (!name || !currentBook) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Circle name and inaugural book are required' }));
              return;
            }

            const cleanFounderEmail = founderEmail ? founderEmail.trim().toLowerCase() : '';

            const newCircle = await db.readingCircle.create({
              data: {
                name: name.trim(),
                currentBook: currentBook.trim(),
                author: author ? author.trim() : 'Acclaimed Author',
                meetingDate: meetingDate ? meetingDate.trim() : 'Sundays, 7:00 PM EST',
                topic: topic ? topic.trim() : 'Literary Exploration & Shared Reflection',
                coverGradient: coverGradient || 'from-[#1e2738] to-[#121620]',
                founderEmail: cleanFounderEmail,
                founderName: founderName ? founderName.trim() : 'Fellow Scholar',
                membersCount: 1,
                joinedEmails: cleanFounderEmail ? [cleanFounderEmail] : [],
              },
            });

            // Automatically join the newly founded circle for the founder
            if (cleanFounderEmail) {
              const founderProfile = await db.profile.findFirst({ where: { email: cleanFounderEmail } });
              if (founderProfile) {
                const currentJoined = Array.isArray(founderProfile.joinedCircles) ? founderProfile.joinedCircles : [];
                if (!currentJoined.includes(newCircle.id)) {
                  await db.profile.update({
                    where: { id: founderProfile.id },
                    data: {
                      joinedCircles: [...currentJoined, newCircle.id],
                      guildsJoined: currentJoined.length + 1,
                    },
                  });
                }
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ circle: newCircle }));
          } catch (err: any) {
            console.error('Error founding circle:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to found reading circle', details: err?.message }));
          }
          return;
        }

        // PUT /api/circles (Edit a reading circle - Founder only)
        if (url.pathname === '/api/circles' && (req.method === 'PUT' || req.method === 'PATCH')) {
          const db = getPrisma();
          try {
            const body = await parseJsonBody(req);
            const { id, name, currentBook, author, meetingDate, topic, userEmail } = body;
            if (!id || !name || !currentBook) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing required fields (id, name, currentBook)' }));
              return;
            }

            const cleanUserEmail = userEmail ? userEmail.trim().toLowerCase() : '';

            // Find circle in DB
            let circle = await db.readingCircle.findUnique({ where: { id } });
            if (!circle) {
              // Check if it's a seed circle
              const seed = READING_CIRCLES_DATA.find((c) => c.id === id);
              if (!seed) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Reading circle not found' }));
                return;
              }

              // Founder check on seed circle if applicable
              if (seed.founderEmail && cleanUserEmail && seed.founderEmail.toLowerCase() !== cleanUserEmail) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Only the founder can edit this reading salon' }));
                return;
              }

              circle = await db.readingCircle.create({
                data: {
                  id: seed.id,
                  name: name.trim(),
                  currentBook: currentBook.trim(),
                  author: author ? author.trim() : seed.author,
                  meetingDate: meetingDate ? meetingDate.trim() : seed.meetingDate,
                  topic: topic ? topic.trim() : seed.topic,
                  coverGradient: seed.coverGradient,
                  coverImage: seed.coverImage,
                  membersCount: seed.membersCount,
                  founderEmail: seed.founderEmail || cleanUserEmail,
                  founderName: seed.founderName || 'Fellow Scholar',
                },
              });
            } else {
              // Founder permission check
              if (circle.founderEmail && cleanUserEmail && circle.founderEmail.toLowerCase() !== cleanUserEmail) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Only the salon founder can edit this circle' }));
                return;
              }

              circle = await db.readingCircle.update({
                where: { id },
                data: {
                  name: name.trim(),
                  currentBook: currentBook.trim(),
                  author: author ? author.trim() : circle.author,
                  meetingDate: meetingDate ? meetingDate.trim() : circle.meetingDate,
                  topic: topic ? topic.trim() : circle.topic,
                },
              });
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ circle }));
          } catch (err: any) {
            console.error('Error updating circle:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to update reading circle', details: err?.message }));
          }
          return;
        }

        // POST /api/circles/join (Join or leave a salon)
        if (url.pathname === '/api/circles/join' && req.method === 'POST') {
          const db = getPrisma();
          try {
            const body = await parseJsonBody(req);
            const { circleId, userEmail, action } = body;
            if (!circleId) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing circleId' }));
              return;
            }

            // Update custom circle in DB if it's stored there
            const dbCircle = await db.readingCircle.findUnique({ where: { id: circleId } });
            if (dbCircle) {
              let joinedEmails = Array.isArray(dbCircle.joinedEmails) ? [...dbCircle.joinedEmails] : [];
              if (action === 'join' && userEmail && !joinedEmails.includes(userEmail)) {
                joinedEmails.push(userEmail);
              } else if (action === 'leave' && userEmail) {
                joinedEmails = joinedEmails.filter((e) => e !== userEmail);
              }
              const newCount = Math.max(1, dbCircle.membersCount + (action === 'join' ? 1 : -1));
              await db.readingCircle.update({
                where: { id: circleId },
                data: {
                  joinedEmails,
                  membersCount: newCount,
                },
              });
            }

            // Update user's profile joinedCircles list
            if (userEmail) {
              const profile = await db.profile.findFirst({ where: { email: userEmail } });
              if (profile) {
                let currentJoined = Array.isArray(profile.joinedCircles) ? [...profile.joinedCircles] : [];
                if (action === 'join' && !currentJoined.includes(circleId)) {
                  currentJoined.push(circleId);
                } else if (action === 'leave') {
                  currentJoined = currentJoined.filter((id) => id !== circleId);
                }
                await db.profile.update({
                  where: { id: profile.id },
                  data: {
                    joinedCircles: currentJoined,
                    guildsJoined: currentJoined.length,
                  },
                });
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            console.error('Error joining/leaving circle:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to update membership', details: err?.message }));
          }
          return;
        }

        // GET /api/books/daily
        if (url.pathname === '/api/books/daily') {
          const db = getPrisma();
          if (req.method === 'GET') {
            try {
              const requestedDate = url.searchParams.get('dateKey') || getTodayDateKey();
              const forceRefresh = url.searchParams.get('refresh') === 'true';
              const cached = serializedDailyCache.get(requestedDate);
              const cachedStr = cached ? cached.buffer.toString('utf8') : '';
              const cachedHasCovers = cachedStr.includes('"coverImage"');
              if (!forceRefresh && cached && cachedHasCovers && Date.now() - cached.timestamp < 12 * 60 * 60 * 1000) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Length', cached.buffer.length);
                res.end(cached.buffer);
                return;
              }

              const books = forceRefresh
                ? await refreshDailyCatalogForDate(db, requestedDate)
                : await getDailyCatalog(db, requestedDate);
              const payload = JSON.stringify({
                dateKey: requestedDate,
                books,
                total: books.length,
                refreshesAt: '12:00 AM Daily',
              });
              const buffer = Buffer.from(payload);
              serializedDailyCache.set(requestedDate, { timestamp: Date.now(), buffer });

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Content-Length', buffer.length);
              res.end(buffer);
            } catch (err: any) {
              console.error('Error fetching daily books:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to fetch daily catalog', details: err?.message }));
            }
            return;
          }
        }

        // POST /api/books/daily/refresh (Autonomous midnight refresh or quota-protected call)
        if (url.pathname === '/api/books/daily/refresh') {
          const db = getPrisma();
          if (req.method === 'POST') {
            try {
              const body = await parseJsonBody(req);
              const targetDate = body.dateKey || getTodayDateKey();

              // Quota Guard: If today's catalog is already populated with 30 AI books, do not call Gemini again
              const existing = await db.dailyCatalog.findUnique({
                where: { dateKey: targetDate },
                select: { booksJson: true },
              });

              if (existing && Array.isArray(existing.booksJson) && existing.booksJson.length >= 30) {
                const firstId = (existing.booksJson[0] as any)?.id || '';
                if (firstId.startsWith('ai-daily-') && !body.force) {
                  console.log(`[API /api/books/daily/refresh] Serving existing AI catalog for ${targetDate} (quota preserved)`);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    message: `Catalog already up to date for ${targetDate}`,
                    dateKey: targetDate,
                    books: existing.booksJson,
                    total: existing.booksJson.length,
                  }));
                  return;
                }
              }

              console.log(`[API /api/books/daily/refresh POST] Refreshing AI catalog for dateKey=${targetDate}`);
              serializedDailyCache.delete(targetDate);
              const books = await refreshDailyCatalogForDate(db, targetDate);
              serializedDailyCache.delete(targetDate);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                message: `AI Catalog refreshed for ${targetDate}`,
                dateKey: targetDate,
                books,
                total: books.length,
              }));
            } catch (err: any) {
              console.error('Error refreshing daily books:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to refresh daily catalog', details: err?.message }));
            }
            return;
          }
        }

        // GET /api/books/daily/status (Scheduler info)
        if (url.pathname === '/api/books/daily/status') {
          const ms = getMsUntilMidnight();
          const hoursUntil = (ms / (1000 * 60 * 60)).toFixed(2);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            today: getTodayDateKey(),
            tomorrow: getTomorrowDateKey(),
            nextMidnightInMs: ms,
            hoursUntilMidnight: hoursUntil,
            scheduledTime: '12:00:00 AM',
          }));
          return;
        }

        // GET /api/cover-lookup?title=...&author=...
        if (url.pathname === '/api/cover-lookup' && req.method === 'GET') {
          const title = url.searchParams.get('title') || '';
          const author = url.searchParams.get('author') || '';

          if (!title) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Title required' }));
            return;
          }

          const cacheKey = `${title.toLowerCase().trim()}_${author.toLowerCase().trim()}`;
          if (coverLookupCache.has(cacheKey)) {
            const cachedCover = coverLookupCache.get(cacheKey);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ coverImage: cachedCover }));
            return;
          }

          // 1. Check local static books first
          const localMatch = BOOKS_DATA.find(
            (b) => b.title.toLowerCase().trim() === title.toLowerCase().trim()
          );
          if (localMatch?.coverImage) {
            coverLookupCache.set(cacheKey, localMatch.coverImage);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ coverImage: localMatch.coverImage }));
            return;
          }

          // 2. Open Library search with title + author
          try {
            const mainTitle = title.split(/[:\-–—]/)[0].trim();
            const cleanAuthor = author
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            const q = cleanAuthor ? `${mainTitle} ${cleanAuthor}` : mainTitle;
            const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=title,author_name,cover_i`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const olRes = await fetch(olUrl, {
              signal: controller.signal,
              headers: { 'User-Agent': 'BookshelfApp/1.0 (cover-lookup)' },
            });
            clearTimeout(timeout);

            if (olRes.ok) {
              const olData = await olRes.json();
              const docs = olData.docs || [];
              const match = docs.find((d: any) => d.cover_i && d.title?.toLowerCase().includes(mainTitle.toLowerCase()))
                         || docs.find((d: any) => d.cover_i);

              if (match?.cover_i) {
                const coverUrl = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`)}`;
                coverLookupCache.set(cacheKey, coverUrl);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ coverImage: coverUrl }));
                return;
              }
            }
          } catch {
            // ignore and fallback
          }

          // 3. Fallback: title only
          try {
            const mainTitle = title.split(/[:\-–—]/)[0].trim();
            const olUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(mainTitle)}&limit=5&fields=title,cover_i`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const olRes = await fetch(olUrl, {
              signal: controller.signal,
              headers: { 'User-Agent': 'BookshelfApp/1.0 (cover-lookup)' },
            });
            clearTimeout(timeout);

            if (olRes.ok) {
              const olData = await olRes.json();
              const docs = olData.docs || [];
              const match = docs.find((d: any) => d.cover_i);
              if (match?.cover_i) {
                const coverUrl = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`)}`;
                coverLookupCache.set(cacheKey, coverUrl);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ coverImage: coverUrl }));
                return;
              }
            }
          } catch {
            // ignore
          }

          coverLookupCache.set(cacheKey, null);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ coverImage: null }));
          return;
        }

        // GET /api/cover-proxy (proxy and cache external book covers to avoid browser CORS/archive.org socket drops)
        if (url.pathname === '/api/cover-proxy' && (req.method === 'GET' || req.method === 'HEAD')) {
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'image/svg+xml');
            res.end(generateParchmentSvgFallback('Invalid URL'));
            return;
          }

          // Validate protocols: reject unsupported or dangerous schemes (ftp, file, javascript, data, etc.) with HTTP 400
          const isHttpOrHttps = targetUrl.startsWith('http://') || targetUrl.startsWith('https://');
          const hasUnsupportedScheme = !isHttpOrHttps && (
            targetUrl.includes('://') ||
            /^(javascript|file|data|ftp|blob|vbscript):/i.test(targetUrl) ||
            /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(targetUrl)
          );

          if (hasUnsupportedScheme) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'image/svg+xml');
            res.end(generateParchmentSvgFallback('Unsupported Protocol'));
            return;
          }

          // Handle internal fallback tokens (e.g. 'archived_volume_fallback' or token without scheme) with HTTP 200
          if (!isHttpOrHttps) {
            let cachedFallback = coverCache.get(targetUrl);
            const ttl = cachedFallback?.ttl || COVER_CACHE_TTL_MS;
            if (!cachedFallback || Date.now() - cachedFallback.timestamp >= ttl) {
              const svg = generateParchmentSvgFallback(targetUrl === 'archived_volume_fallback' ? 'Archived Volume' : targetUrl);
              const buffer = Buffer.from(svg, 'utf8');
              cachedFallback = { buffer, contentType: 'image/svg+xml', timestamp: Date.now(), ttl: COVER_CACHE_TTL_MS };
              if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
                const oldestKey = coverCache.keys().next().value;
                if (oldestKey) coverCache.delete(oldestKey);
              }
              coverCache.set(targetUrl, cachedFallback);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Content-Length', cachedFallback.buffer.length);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(cachedFallback.buffer);
            return;
          }

          // 1. In-memory buffer cache hit (<1ms SLA)
          const cached = coverCache.get(targetUrl);
          const ttl = cached?.ttl || COVER_CACHE_TTL_MS;
          if (cached && Date.now() - cached.timestamp < ttl) {
            res.statusCode = 200;
            res.setHeader('Content-Type', cached.contentType);
            res.setHeader('Content-Length', cached.buffer.length);
            res.setHeader('Cache-Control', cached.contentType === 'image/svg+xml' ? 'public, max-age=3600' : 'public, max-age=604800, immutable');
            res.end(cached.buffer);
            return;
          }

          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const upstream = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              },
              signal: controller.signal,
              redirect: 'follow',
            });
            clearTimeout(timeout);

            if (!upstream.ok) {
              const svg = generateParchmentSvgFallback();
              const buffer = Buffer.from(svg, 'utf8');
              if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
                const oldestKey = coverCache.keys().next().value;
                if (oldestKey) coverCache.delete(oldestKey);
              }
              coverCache.set(targetUrl, { buffer, contentType: 'image/svg+xml', timestamp: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'image/svg+xml');
              res.setHeader('Content-Length', buffer.length);
              res.setHeader('Cache-Control', 'public, max-age=3600');
              res.end(buffer);
              return;
            }

            const cType = upstream.headers.get('content-type') || 'image/jpeg';
            const arrayBuf = await upstream.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
              const oldestKey = coverCache.keys().next().value;
              if (oldestKey) coverCache.delete(oldestKey);
            }
            coverCache.set(targetUrl, { buffer, contentType: cType, timestamp: Date.now(), ttl: COVER_CACHE_TTL_MS });

            res.statusCode = 200;
            res.setHeader('Content-Type', cType);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
            res.end(buffer);
          } catch (err: any) {
            // Deliver high-fidelity parchment SVG placeholder and cache negatively
            const svg = generateParchmentSvgFallback();
            const buffer = Buffer.from(svg, 'utf8');
            if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
              const oldestKey = coverCache.keys().next().value;
              if (oldestKey) coverCache.delete(oldestKey);
            }
            coverCache.set(targetUrl, { buffer, contentType: 'image/svg+xml', timestamp: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(buffer);
          }
          return;
        }

        // POST /api/archivist/consult (AI-powered situational recommendation with Open Library live enrichment)
        if (url.pathname === '/api/archivist/consult' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const query = body?.query;
            if (!query || typeof query !== 'string' || !query.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Query is required' }));
              return;
            }

            const result = await getArchivistAiRecommendations(query.trim());
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error('[API /api/archivist/consult] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Archivist consultation failed', details: err?.message }));
          }
          return;
        }

        // GET /api/margin-notes (fetch top 4 or all with filters)
        if (url.pathname === '/api/margin-notes' && req.method === 'GET') {
          const db = getPrisma();
          try {
            const isTop = url.searchParams.get('top') === 'true';
            const limit = parseInt(url.searchParams.get('limit') || '4', 10);
            const search = url.searchParams.get('search') || undefined;
            const bookTitle = url.searchParams.get('bookTitle') || undefined;
            const sort = url.searchParams.get('sort') || undefined;

            let notes;
            if (isTop) {
              notes = await getTopMarginNotes(db, limit);
            } else {
              notes = await getAllMarginNotes(db, { search, bookTitle, sort });
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ notes }));
          } catch (err: any) {
            console.error('Error fetching margin notes:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch margin notes', details: err?.message }));
          }
          return;
        }

        // POST /api/margin-notes (inscribe a new note)
        if (url.pathname === '/api/margin-notes' && req.method === 'POST') {
          const db = getPrisma();
          try {
            const body = await parseJsonBody(req);
            const { bookTitle, bookAuthor, passageSnippet, noteText, pageNumber, readerName, readerHandle, readerAvatar, userId } = body;

            // Validation: bookTitle, noteText are required (passageSnippet defaulted gracefully if omitted)
            if (!bookTitle?.trim() || !noteText?.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Book Volume and Reflection text are required.' }));
              return;
            }

            const rawSnippet = passageSnippet?.trim() || (noteText.trim().length > 60 ? noteText.trim().slice(0, 60) + '...' : noteText.trim());
            const cleanSnippet = rawSnippet.startsWith('“') || rawSnippet.startsWith('"')
              ? rawSnippet
              : `“${rawSnippet}”`;

            const parsedPage = pageNumber ? parseInt(pageNumber, 10) : null;
            const validPage = parsedPage && !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : null;

            const newNote = await db.marginNote.create({
              data: {
                bookTitle: bookTitle.trim(),
                bookAuthor: bookAuthor?.trim() || null,
                passageSnippet: cleanSnippet,
                noteText: noteText.trim(),
                pageNumber: validPage,
                readerName: readerName?.trim() || 'You (The Reader)',
                readerHandle: readerHandle?.trim() || '@you_in_the_margins',
                readerAvatar: readerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                userId: userId || null,
                likes: 1,
                timestamp: 'Just now',
                isTopPick: true,
                comments: [],
              },
            });

            // Invalidate top notes cache so fresh note immediately appears
            invalidateTopNotesCache();

            // If userId provided, optionally update profile's marginNotesCount
            if (userId) {
              try {
                await db.profile.updateMany({
                  where: { OR: [{ id: userId }, { clerkId: userId }, { email: userId }] },
                  data: { marginNotesCount: { increment: 1 } },
                });
              } catch (profileErr) {
                console.warn('[MarginNotes] Could not increment profile margin notes count:', profileErr);
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, note: newNote }));
          } catch (err: any) {
            console.error('Error creating margin note:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to create margin note', details: err?.message }));
          }
          return;
        }

        // POST /api/margin-notes/like (toggle or increment like)
        if (url.pathname === '/api/margin-notes/like' && req.method === 'POST') {
          const db = getPrisma();
          try {
            const body = await parseJsonBody(req);
            const { noteId, liked } = body;

            if (!noteId) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing noteId' }));
              return;
            }

            const updatedNote = await db.marginNote.update({
              where: { id: noteId },
              data: {
                likes: liked === false ? { decrement: 1 } : { increment: 1 },
              },
            });

            // Invalidate top notes cache so updated count is reflected
            invalidateTopNotesCache();

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, likes: updatedNote.likes, note: updatedNote }));
          } catch (err: any) {
            console.error('Error liking margin note:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to like note', details: err?.message }));
          }
          return;
        }

        // POST /api/margin-notes/comment (add reader comment / communication)
        if (url.pathname === '/api/margin-notes/comment' && req.method === 'POST') {
          const db = getPrisma();
          try {
            const body = await parseJsonBody(req);
            const { noteId, readerName, readerAvatar, text } = body;

            if (!noteId || !text?.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing noteId or comment text' }));
              return;
            }

            const existingNote = await db.marginNote.findUnique({ where: { id: noteId } });
            if (!existingNote) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Note not found' }));
              return;
            }

            const currentComments: any[] = Array.isArray(existingNote.comments) ? (existingNote.comments as any[]) : [];
            const newComment = {
              id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              readerName: readerName?.trim() || 'Fellow Reader',
              readerAvatar: readerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              text: text.trim(),
              createdAt: 'Just now',
            };

            currentComments.push(newComment);

            const updated = await db.marginNote.update({
              where: { id: noteId },
              data: { comments: currentComments },
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, note: updated, comments: currentComments }));
          } catch (err: any) {
            console.error('Error adding comment:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to add comment', details: err?.message }));
          }
          return;
        }

        next();
      });

    },
  };
}
