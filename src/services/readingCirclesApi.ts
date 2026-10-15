import { ReadingCircle } from '../types/book';
import { READING_CIRCLES_DATA } from '../data/communityData';

const STORAGE_KEY = 'bookshelf_reading_circles';

export async function fetchReadingCircles(): Promise<ReadingCircle[]> {
  try {
    const res = await fetch('/api/circles');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.circles) && data.circles.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.circles));
        return data.circles;
      }
    }
  } catch (err) {
    console.warn('[ReadingCirclesAPI] Fallback to cache/defaults:', err);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return READING_CIRCLES_DATA;
}

export async function foundReadingCircle(params: {
  name: string;
  currentBook: string;
  author?: string;
  meetingDate?: string;
  topic?: string;
  founderEmail?: string;
  founderName?: string;
}): Promise<ReadingCircle> {
  const gradientList = [
    'from-[#1e2738] to-[#121620]',
    'from-[#4d3324] to-[#26180f]',
    'from-[#2e1d3d] to-[#160d1f]',
    'from-[#2c3d2e] to-[#152016]',
    'from-[#3d2b28] to-[#1e1514]',
  ];
  const coverGradient = gradientList[Math.floor(Math.random() * gradientList.length)];

  try {
    const res = await fetch('/api/circles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        coverGradient,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.circle) {
        return data.circle;
      }
    }
  } catch (err) {
    console.warn('[ReadingCirclesAPI] Server create failed, using local offline circle:', err);
  }

  // Fallback local circle
  const localCircle: ReadingCircle = {
    id: `circle-custom-${Date.now()}`,
    name: params.name,
    currentBook: params.currentBook,
    author: params.author || 'Acclaimed Author',
    membersCount: 1,
    meetingDate: params.meetingDate || 'Sundays, 7:00 PM EST',
    topic: params.topic || 'Literary Exploration & Deep Discussion',
    coverGradient,
    founderEmail: params.founderEmail,
    founderName: params.founderName,
    createdAt: new Date().toISOString(),
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const existing: ReadingCircle[] = saved ? JSON.parse(saved) : [...READING_CIRCLES_DATA];
    existing.unshift(localCircle);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {}

  return localCircle;
}

export async function joinReadingCircleApi(
  circleId: string,
  userEmail?: string,
  action: 'join' | 'leave' = 'join'
): Promise<boolean> {
  try {
    const res = await fetch('/api/circles/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        circleId,
        userEmail,
        action,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[ReadingCirclesAPI] Join API failed:', err);
    return false;
  }
}

export async function updateReadingCircle(params: {
  id: string;
  name: string;
  currentBook: string;
  author?: string;
  meetingDate?: string;
  topic?: string;
  userEmail: string;
}): Promise<ReadingCircle> {
  const res = await fetch('/api/circles', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update reading salon');
  }

  const data = await res.json();
  if (data.circle) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ReadingCircle[] = JSON.parse(saved);
        const idx = parsed.findIndex((c) => c.id === params.id);
        if (idx !== -1) {
          parsed[idx] = { ...parsed[idx], ...data.circle };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch {}
    return data.circle;
  }
  throw new Error('No circle returned from server');
}

