import { Book } from '../types/book';
import { BOOKS_DATA } from '../data/booksData';

export interface ArchivistRecommendation {
  book: Book;
  rationale: string;
  badge: string;
}

export interface ArchivistResult {
  query: string;
  letter: string;
  source?: 'gemini' | 'openai' | 'groq' | 'openlibrary_ai';
  recommendations: ArchivistRecommendation[];
}

/**
 * Intelligent literary reasoning engine for The Archivist.
 * Analyzes mood, emotional cadence, themes, and motifs from the user's invocation
 * and returns 3 bespoke book recommendations with tailored rationales.
 */
export function consultArchivist(rawQuery: string): ArchivistResult {
  const query = rawQuery.trim();
  const qLower = query.toLowerCase();

  // Keyword / motif scoring map
  const scoredBooks = BOOKS_DATA.map((book) => {
    let score = 0;

    const searchableText = [
      book.title,
      book.author,
      book.genre,
      book.secondaryGenre || '',
      book.synopsis,
      book.quote,
      book.whyYouWillLoveIt,
      ...(book.moodTags || []),
    ]
      .join(' ')
      .toLowerCase();

    // 1. Direct query terms match using word boundaries
    const words = qLower.split(/[\s,.'"-]+/).filter((w) => w.length > 2);
    for (const word of words) {
      const boundaryRegex = new RegExp(`\\b${word}`, 'i');
      if (boundaryRegex.test(searchableText)) {
        score += 3;
      }
      if (boundaryRegex.test(book.title)) {
        score += 6;
      }
      if (boundaryRegex.test(book.author)) {
        score += 5;
      }
      if (boundaryRegex.test(book.genre)) {
        score += 5;
      }
      if (book.moodTags?.some((tag) => boundaryRegex.test(tag))) {
        score += 6;
      }
    }

    // 2. Thematic motifs & emotional resonance detection
    if (/romance|romantic|love|passion|intimacy|heart|longing|lover|dating|relationship|tender/i.test(qLower)) {
      if (['Best Fiction', 'Top Classics'].includes(book.genre)) score += 9;
      if (book.secondaryGenre?.toLowerCase().includes('romance') || book.secondaryGenre?.toLowerCase().includes('fiction')) score += 6;
      if (book.moodTags?.some((t) => /emotional|poetic|melancholic|contemplation|resonance/i.test(t))) score += 7;
      if (['Money & Investing', 'Startups & Entrepreneurship', 'Business & Leadership'].includes(book.genre)) score -= 15;
    }

    if (/sci-fi|science|future|ai|tech|ted chiang|machine|digital/i.test(qLower)) {
      if (['Tech & AI', 'Best Fiction'].includes(book.genre)) score += 6;
      if (book.secondaryGenre?.toLowerCase().includes('ai') || book.secondaryGenre?.toLowerCase().includes('technology')) score += 5;
    }

    if (/rain|rainy|jimbocho|bookstore|quiet|peace|calm|cozy|autumn|afternoon/i.test(qLower)) {
      if (book.moodTags?.some((t) => /quiet|contemplation|poetic|philosophical/i.test(t))) score += 7;
      if (['Philosophy', 'Top Classics', 'Best Fiction'].includes(book.genre)) score += 4;
      if (['Money & Investing', 'Startups & Entrepreneurship'].includes(book.genre)) score -= 10;
    }

    if (/mystery|barcelona|puzzle|gothic|labyrinth|detective|shadow|secret/i.test(qLower)) {
      if (book.moodTags?.some((t) => /labyrinth|intellectual/i.test(t))) score += 7;
      if (book.secondaryGenre?.toLowerCase().includes('gothic') || book.secondaryGenre?.toLowerCase().includes('magical')) score += 6;
      if (book.title.includes('Solitude') || book.title.includes('Mockingbird') || book.title.includes('Midnight')) score += 5;
      if (['Money & Investing', 'Startups & Entrepreneurship'].includes(book.genre)) score -= 10;
    }

    if (/melancholy|heal|restless|soul|grief|sorrow|solace|lonely|heart|ache/i.test(qLower)) {
      if (book.moodTags?.some((t) => /melancholic|solace|solitude|resonance|contemplation/i.test(t))) score += 8;
      if (book.title.includes('Solitude') || book.title.includes('Beloved') || book.title.includes('Courage')) score += 6;
      if (['Money & Investing', 'Startups & Entrepreneurship'].includes(book.genre)) score -= 15;
    }

    if (/habit|discipline|growth|routine|focus|procrastinat|better|improve|lazy/i.test(qLower)) {
      if (book.genre === 'Self-Help') score += 8;
      if (book.title.includes('Habits') || book.title.includes('Mindset')) score += 8;
    }

    if (/money|rich|invest|wealth|market|stock|finance|capital/i.test(qLower)) {
      if (book.genre === 'Money & Investing') score += 10;
    }

    if (/startup|entrepreneur|business|lead|founder|company|scale/i.test(qLower)) {
      if (['Startups & Entrepreneurship', 'Business & Leadership'].includes(book.genre)) score += 10;
    }

    if (/meaning|philosophy|exist|absurd|life|death|why|truth/i.test(qLower)) {
      if (book.genre === 'Philosophy') score += 8;
      if (book.moodTags?.some((t) => /philosophical|labyrinth|clarity/i.test(t))) score += 5;
    }

    // Baseline fallback score from rating and review count
    score += book.rating * 0.5;

    return { book, score };
  });

  // Sort descending by score
  scoredBooks.sort((a, b) => b.score - a.score);

  // Take top 3 diverse books
  const topMatches = scoredBooks.slice(0, 3).map((item, idx) => {
    const book = item.book;
    let badge = 'Archival Match';
    let rationale = '';

    if (idx === 0) {
      badge = 'Prime Accord';
      rationale = `Chosen as the quintessential resonance for "${query}". Its exploration of ${book.secondaryGenre || book.genre} and evocative prose precisely mirrors the spirit of your invocation.`;
    } else if (idx === 1) {
      badge = 'Harmonic Companion';
      rationale = `Provides a deeper, introspective counterpoint. ${book.author}'s masterwork balances the mood with profound clarity, exploring ${book.moodTags?.[0] || 'subtle human truth'}.`;
    } else {
      badge = 'Quiet Revelation';
      rationale = `An unexpected treasure from the shelves. This volume offers timeless solace, unforgettable cadence, and a rare lens through which to contemplate your thoughts.`;
    }

    return {
      book,
      badge,
      rationale,
    };
  });

  // Generate evocative archivist dispatch letter
  const letters = [
    `“Traveler of pages, your query of «${query}» has stirred the quiet alcoves of our vault. We have drawn back the velvet drapes and retrieved three volumes whose pages hum with this exact timbre. Take your time with them; allow their ink to steady your thoughts.”`,
    `“A rare invocation. For one asking of «${query}», the library offers no simple answers—only deeper mirrors. These three masterworks were inscribed by writers who walked this very perimeter of the human condition.”`,
    `“The archivist has consulted the ledger. To meet the frequency of «${query}», we bypassed the noisy shelves and retrieved these three profound works. May their bindings hold whatever weight you carry tonight.”`,
  ];

  // Pick deterministic letter based on query length/content
  const letterIndex = Math.abs(query.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % letters.length;

  return {
    query,
    letter: letters[letterIndex],
    recommendations: topMatches,
  };
}
