import { MarginNote } from '../types/book';
import { MARGIN_NOTES_DATA } from '../data/communityData';

export async function fetchTopMarginNotes(): Promise<MarginNote[]> {
  try {
    const res = await fetch('/api/margin-notes?top=true&limit=4', {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.notes) && data.notes.length > 0) {
        return data.notes;
      }
    }
  } catch (err) {
    console.warn('[MarginNotesApi] Fallback to local default notes on fetchTopMarginNotes:', err);
  }
  return MARGIN_NOTES_DATA.slice(0, 4);
}

export async function fetchAllMarginNotes(params?: {
  search?: string;
  bookTitle?: string;
  sort?: string;
}): Promise<MarginNote[]> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.bookTitle && params.bookTitle !== 'All') query.set('bookTitle', params.bookTitle);
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`/api/margin-notes?${query.toString()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.notes)) {
        return data.notes;
      }
    }
  } catch (err) {
    console.warn('[MarginNotesApi] Fallback on fetchAllMarginNotes:', err);
  }
  return MARGIN_NOTES_DATA;
}

export async function inscribeMarginNote(note: {
  bookTitle: string;
  bookAuthor?: string;
  pageNumber?: number;
  passageSnippet: string;
  noteText: string;
  readerName?: string;
  readerHandle?: string;
  readerAvatar?: string;
  userId?: string;
}): Promise<MarginNote> {
  const res = await fetch('/api/margin-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to inscribe note');
  }

  const data = await res.json();
  return data.note;
}

export async function likeMarginNote(
  noteId: string,
  userId?: string,
  liked = true
): Promise<{ likes: number; note?: MarginNote }> {
  try {
    const res = await fetch('/api/margin-notes/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, userId, liked }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[MarginNotesApi] Error liking note:', err);
  }
  return { likes: 0 };
}

export async function addCommentToNote(
  noteId: string,
  text: string,
  readerName?: string,
  readerAvatar?: string
): Promise<{ success: boolean; note?: MarginNote; comments?: any[] }> {
  const res = await fetch('/api/margin-notes/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId, text, readerName, readerAvatar }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to add comment');
  }

  return await res.json();
}
