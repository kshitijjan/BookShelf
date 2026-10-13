import { Book } from '../types/book';

const BASE_URL = 'https://openlibrary.org';

const generateGradient = (seed: string) => {
  const colors = [
    'from-[#2d3748] to-[#1a202c]',
    'from-[#705a4f] to-[#4a3b32]',
    'from-[#5c6e58] to-[#3a4a36]',
    'from-[#5d4037] to-[#3e2723]',
    'from-[#455a64] to-[#263238]',
    'from-[#795548] to-[#5d4037]',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const mapOpenLibraryBook = (doc: any): Book => {
  const id = doc.key || (doc.work_key ? `/works/${doc.work_key}` : Math.random().toString());
  
  const coverId = doc.cover_i || doc.cover_id;
  const coverImage = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined;
  
  const authors = doc.author_name ? doc.author_name : (doc.authors ? doc.authors.map((a:any) => a.name) : ['Unknown Author']);
  const authorName = authors[0] || 'Unknown Author';

  // Use real data from API if available, otherwise fallback to reasonable defaults
  const realRating = doc.ratings_average;
  const realReviewCount = doc.ratings_count || doc.readinglog_count || doc.editions_count;

  // Generate dynamic, meaningful insights based on available metadata
  const subjects = doc.subject ? doc.subject.filter((s: string) => typeof s === 'string') : [];
  const topSubjects = subjects.slice(0, 2);
  
  let dynamicWhyYouWillLoveIt = `A captivating work by ${authorName} that stands as a notable addition to any collection.`;
  if (topSubjects.length === 2) {
    dynamicWhyYouWillLoveIt = `Perfect for readers who appreciate themes of ${topSubjects[0].toLowerCase()} and ${topSubjects[1].toLowerCase()}. ${authorName} delivers a compelling experience in this genre.`;
  } else if (topSubjects.length === 1) {
    dynamicWhyYouWillLoveIt = `If you are drawn to ${topSubjects[0].toLowerCase()}, this highly-regarded work by ${authorName} is an essential read.`;
  }

  const title = doc.title || 'Unknown Title';
  const firstSentence = (doc.first_sentence && typeof doc.first_sentence === 'string' ? doc.first_sentence : doc.first_sentence?.[0]);

  return {
    id: id,
    title: title,
    author: authorName,
    year: doc.first_publish_year || doc.publish_year?.[0] || new Date().getFullYear(),
    rating: realRating ? Number(realRating) : 4.0 + (Math.random() * 0.9),
    reviewCount: realReviewCount ? Number(realReviewCount) : Math.floor(Math.random() * 500) + 50,
    pages: doc.number_of_pages_median || Math.floor(Math.random() * 300) + 150,
    genre: subjects[0] || 'General',
    secondaryGenre: subjects.length > 1 ? subjects[1] : undefined,
    synopsis: firstSentence || `An exploration by ${authorName}, originally published in ${doc.first_publish_year || 'various editions'}.`,
    quote: firstSentence || "",
    whyYouWillLoveIt: dynamicWhyYouWillLoveIt,
    moodTags: subjects.slice(0, 3).length > 0 ? subjects.slice(0, 3) : ['Classic', 'Archival'],
    coverGradient: generateGradient(title),
    coverTextColor: '#f7f4ed',
    coverImage: coverImage,
    isbn: doc.isbn ? doc.isbn[0] : 'N/A'
  };
};

const memoryCache = new Map<string, Book[]>();
const CACHE_PREFIX = 'bookshelf_ol_cache_';

export const getCachedBooksBySubject = (subject: string): Book[] | null => {
  const cleanSubject = subject.toLowerCase().replace(/ /g, '_');
  const cacheKey = `subject_${cleanSubject}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      memoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  const cleanQuery = query.toLowerCase().trim();
  const cacheKey = `search_${cleanQuery}`;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      memoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }

  const fields = 'key,title,author_name,cover_i,cover_id,first_publish_year,ratings_average,ratings_count,number_of_pages_median,subject,first_sentence';
  const res = await fetch(`${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=35&fields=${fields}`);
  if (!res.ok) throw new Error('Failed to fetch books');
  const data = await res.json();
  const mappedBooks = (data.docs || []).map(mapOpenLibraryBook);
  const withCovers = mappedBooks.filter((b: Book) => !!b.coverImage);
  
  withCovers.sort((a: Book, b: Book) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    let scoreA = 0;
    let scoreB = 0;
    if (titleA === cleanQuery) scoreA = 3;
    else if (titleA.startsWith(cleanQuery)) scoreA = 2;
    else if (titleA.includes(cleanQuery)) scoreA = 1;
    if (titleB === cleanQuery) scoreB = 3;
    else if (titleB.startsWith(cleanQuery)) scoreB = 2;
    else if (titleB.includes(cleanQuery)) scoreB = 1;
    
    return scoreB - scoreA;
  });

  const results = withCovers.slice(0, 30);
  memoryCache.set(cacheKey, results);
  try {
    sessionStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(results));
  } catch {
    // ignore storage limit
  }
  return results;
};

export const getBooksBySubject = async (subject: string): Promise<Book[]> => {
  const cleanSubject = subject.toLowerCase().replace(/ /g, '_');
  const cacheKey = `subject_${cleanSubject}`;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      memoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }

  const res = await fetch(`${BASE_URL}/subjects/${cleanSubject}.json?limit=40`);
  if (!res.ok) throw new Error('Failed to fetch subject');
  const data = await res.json();
  const mappedBooks = (data.works || []).map(mapOpenLibraryBook);
  const withCovers = mappedBooks.filter((b: Book) => !!b.coverImage);
  withCovers.sort((a: Book, b: Book) => b.reviewCount - a.reviewCount);
  const results = withCovers.slice(0, 30);

  memoryCache.set(cacheKey, results);
  try {
    sessionStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(results));
  } catch {
    // ignore storage limit
  }
  return results;
};

// Fetch real detailed synopsis from the Work API
export const getBookDetailedSynopsis = async (workId: string): Promise<string | null> => {
  try {
    // workId is typically in the format "/works/OLxxxxxxW"
    const res = await fetch(`${BASE_URL}${workId}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.description) {
      if (typeof data.description === 'string') {
        return data.description;
      } else if (data.description.value) {
        return data.description.value;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching book details:', error);
    return null;
  }
};
