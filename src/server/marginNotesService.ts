import { PrismaClient } from '@prisma/client';

export const INITIAL_MARGIN_NOTES = [
  {
    bookTitle: 'The Memory Police',
    bookAuthor: 'Yōko Ogawa',
    pageNumber: 142,
    passageSnippet: '“If you lose the memory of a perfume, does the flower still exist?”',
    noteText: 'Underlined this three times with my graphite pencil. It speaks so directly to how grief operates—not as sudden erasure, but as slow quiet fog settling over rooms you once knew by heart.',
    readerName: 'Elena Rostova',
    readerHandle: '@erostova',
    readerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    likes: 342,
    isTopPick: true,
    timestamp: '2 hours ago',
    comments: [
      {
        id: 'c-1',
        readerName: 'Julian Vance',
        readerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        text: 'The perfume passage shattered me. Grief as atmospheric weather rather than an event.',
        createdAt: '1 hour ago',
      },
    ],
  },
  {
    bookTitle: 'Exhalation',
    bookAuthor: 'Ted Chiang',
    pageNumber: 88,
    passageSnippet: '“The universe began as an enormous breath held, and is slowly exhaling.”',
    noteText: 'The thermodynamic conceit of this story gave me goosebumps at midnight. It reconciles cold physics with cosmic gratitude.',
    readerName: 'Julian Vance',
    readerHandle: '@jvance_reads',
    readerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    likes: 519,
    isTopPick: true,
    timestamp: 'Yesterday',
    comments: [
      {
        id: 'c-2',
        readerName: 'Mira Thorne',
        readerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'Ted Chiang captures awe like no one else. The slow exhale of existence is oddly comforting.',
        createdAt: 'Yesterday',
      },
    ],
  },
  {
    bookTitle: 'Days at the Morisaki Bookshop',
    bookAuthor: 'Satoshi Yagisawa',
    pageNumber: 47,
    passageSnippet: '“In secondhand books, you read two lives: the author’s story, and the ghost of the previous reader.”',
    noteText: 'Found a dried pressed ginkgo leaf tucked into my secondhand copy right here. I am leaving it for whoever borrows it next.',
    readerName: 'Mira Thorne',
    readerHandle: '@mirathorne',
    readerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    likes: 289,
    isTopPick: true,
    timestamp: '3 days ago',
    comments: [
      {
        id: 'c-3',
        readerName: 'Elena Rostova',
        readerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'Pressed leaves in old paperbacks are one of life’s quietest joys.',
        createdAt: '2 days ago',
      },
    ],
  },
  {
    bookTitle: 'Piranesi',
    bookAuthor: 'Susanna Clarke',
    pageNumber: 210,
    passageSnippet: '“The Beauty of the House is immeasurable; its Kindness infinite.”',
    noteText: 'Piranesi’s radical kindness in the face of complete isolation is the most refreshing literary tonic of the 21st century.',
    readerName: 'Devon K.',
    readerHandle: '@devon_k',
    readerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    likes: 412,
    isTopPick: true,
    timestamp: '4 days ago',
    comments: [],
  },
  {
    bookTitle: 'The Myth of Sisyphus',
    bookAuthor: 'Albert Camus',
    pageNumber: 121,
    passageSnippet: '“One must imagine Sisyphus happy.”',
    noteText: 'To stare into absurdity and smile anyway—not with despair, but with fierce defiance. This page changed how I greet every Monday morning.',
    readerName: 'Marcus Aurel',
    readerHandle: '@stoic_reader',
    readerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    likes: 388,
    isTopPick: false,
    timestamp: '5 days ago',
    comments: [],
  },
  {
    bookTitle: 'Atomic Habits',
    bookAuthor: 'James Clear',
    pageNumber: 27,
    passageSnippet: '“You do not rise to the level of your goals. You fall to the level of your systems.”',
    noteText: 'Dog-eared this corner and redrew my entire daily routine. Focus on the architecture, not the finish line.',
    readerName: 'Clara Vance',
    readerHandle: '@clarav',
    readerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    likes: 475,
    isTopPick: false,
    timestamp: '6 days ago',
    comments: [],
  },
  {
    bookTitle: 'One Hundred Years of Solitude',
    bookAuthor: 'Gabriel García Márquez',
    pageNumber: 1,
    passageSnippet: '“Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice.”',
    noteText: 'The greatest opening sentence in human history. The collision of impending death and childlike wonder in a single breath.',
    readerName: 'Gabriel S.',
    readerHandle: '@macondo_echo',
    readerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    likes: 620,
    isTopPick: false,
    timestamp: '1 week ago',
    comments: [],
  },
];

let hasCheckedSeed = false;

// In-memory cache for top margin notes (2s burst protection TTL)
let topNotesCache: { timestamp: number; notes: any[] } | null = null;
const TOP_NOTES_TTL_MS = 2 * 1000;

export function invalidateTopNotesCache() {
  topNotesCache = null;
}

export async function ensureSeedMarginNotes(db: PrismaClient) {
  if (hasCheckedSeed) return;
  try {
    const count = await db.marginNote.count();
    if (count === 0) {
      console.log('[MarginNotesService] Seeding initial margin notes into database...');
      for (const note of INITIAL_MARGIN_NOTES) {
        await db.marginNote.create({
          data: {
            bookTitle: note.bookTitle,
            bookAuthor: note.bookAuthor,
            pageNumber: note.pageNumber,
            passageSnippet: note.passageSnippet,
            noteText: note.noteText,
            readerName: note.readerName,
            readerHandle: note.readerHandle,
            readerAvatar: note.readerAvatar,
            likes: note.likes,
            isTopPick: note.isTopPick,
            timestamp: note.timestamp,
            comments: note.comments,
          },
        });
      }
      console.log('[MarginNotesService] Seeded successfully.');
    }
    hasCheckedSeed = true;
  } catch (err) {
    console.error('[MarginNotesService] Error checking/seeding margin notes:', err);
  }
}

export async function getTopMarginNotes(db: PrismaClient, limit = 4) {
  if (topNotesCache && Date.now() - topNotesCache.timestamp < TOP_NOTES_TTL_MS) {
    return topNotesCache.notes.slice(0, limit);
  }

  await ensureSeedMarginNotes(db);
  // Return top 4 notes (ordered by isTopPick desc, then likes desc)
  const notes = await db.marginNote.findMany({
    orderBy: [
      { isTopPick: 'desc' },
      { likes: 'desc' },
    ],
    take: limit,
  });

  topNotesCache = { timestamp: Date.now(), notes };
  return notes;
}

export async function getAllMarginNotes(
  db: PrismaClient,
  query?: { search?: string; bookTitle?: string; sort?: string; limit?: number; offset?: number }
) {
  await ensureSeedMarginNotes(db);
  const where: any = {};

  if (query?.bookTitle && query.bookTitle !== 'All') {
    where.bookTitle = {
      contains: query.bookTitle,
      mode: 'insensitive',
    };
  }

  if (query?.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { bookTitle: { contains: term, mode: 'insensitive' } },
      { passageSnippet: { contains: term, mode: 'insensitive' } },
      { noteText: { contains: term, mode: 'insensitive' } },
      { readerName: { contains: term, mode: 'insensitive' } },
    ];
  }

  let orderBy: any[] = [{ createdAt: 'desc' }];
  if (query?.sort === 'top') {
    orderBy = [{ likes: 'desc' }, { createdAt: 'desc' }];
  } else if (query?.sort === 'discussed') {
    // will be sorted in JS or by likes
    orderBy = [{ likes: 'desc' }];
  }

  const take = Math.min(query?.limit || 50, 100);
  const skip = query?.offset || 0;

  return await db.marginNote.findMany({
    where,
    orderBy,
    take,
    skip,
  });
}
