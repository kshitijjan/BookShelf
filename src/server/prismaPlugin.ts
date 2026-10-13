import { Plugin } from 'vite';
import { PrismaClient } from '@prisma/client';
import {
  getDailyCatalog,
  refreshDailyCatalogForDate,
  initMidnightCatalogScheduler,
  getTodayDateKey,
  getTomorrowDateKey,
  getMsUntilMidnight,
} from './dailyBooksService';
import {
  getTopMarginNotes,
  getAllMarginNotes,
} from './marginNotesService';


declare const process: any;

try {
  if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // ignore if already loaded or missing
}

let prisma: PrismaClient;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
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

export function prismaApiPlugin(): Plugin {
  return {
    name: 'prisma-api-plugin',
    configureServer(server) {
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

        // GET /api/books/daily
        if (url.pathname === '/api/books/daily') {
          const db = getPrisma();
          if (req.method === 'GET') {
            try {
              const requestedDate = url.searchParams.get('dateKey') || getTodayDateKey();
              console.log(`[API /api/books/daily GET] dateKey=${requestedDate}`);
              const books = await getDailyCatalog(db, requestedDate);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                dateKey: requestedDate,
                books,
                total: books.length,
                refreshesAt: '12:00 AM Daily',
              }));
            } catch (err: any) {
              console.error('Error fetching daily books:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to fetch daily catalog', details: err?.message }));
            }
            return;
          }
        }

        // POST /api/books/daily/refresh (Triggers manual or scheduled refresh from Open Library)
        if (url.pathname === '/api/books/daily/refresh') {
          const db = getPrisma();
          if (req.method === 'POST') {
            try {
              const body = await parseJsonBody(req);
              const targetDate = body.dateKey || getTomorrowDateKey();
              console.log(`[API /api/books/daily/refresh POST] Refreshing catalog for dateKey=${targetDate}`);
              const books = await refreshDailyCatalogForDate(db, targetDate);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                message: `Catalog refreshed for ${targetDate}`,
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

        // GET /api/cover-proxy (proxy and cache external book covers to avoid browser CORS/archive.org socket drops)
        if (url.pathname === '/api/cover-proxy' && (req.method === 'GET' || req.method === 'HEAD')) {
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl || !targetUrl.startsWith('http')) {
            res.statusCode = 400;
            res.end('Invalid URL');
            return;
          }
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
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
              res.statusCode = upstream.status;
              res.end('Upstream error');
              return;
            }

            const cType = upstream.headers.get('content-type') || 'image/jpeg';
            res.setHeader('Content-Type', cType);
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
            const arrayBuf = await upstream.arrayBuffer();
            res.end(new Uint8Array(arrayBuf));
          } catch (err: any) {
            res.statusCode = 502;
            res.end('Proxy fetch failed');
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

            // Strict validation: bookTitle, passageSnippet, noteText are required
            if (!bookTitle?.trim() || !passageSnippet?.trim() || !noteText?.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'All 3 fields (Book Volume, Quoted Line, and Reflection) are required.' }));
              return;
            }

            const cleanSnippet = passageSnippet.trim().startsWith('“') || passageSnippet.trim().startsWith('"')
              ? passageSnippet.trim()
              : `“${passageSnippet.trim()}”`;

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

            const existingNote = await db.marginNote.findUnique({ where: { id: noteId } });
            if (!existingNote) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Note not found' }));
              return;
            }

            const updatedLikes = liked ? existingNote.likes + 1 : Math.max(0, existingNote.likes - 1);
            const updated = await db.marginNote.update({
              where: { id: noteId },
              data: { likes: updatedLikes },
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, likes: updated.likes, note: updated }));
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
