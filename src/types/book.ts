export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  rating: number;
  reviewCount: number;
  pages: number;
  genre: string;
  secondaryGenre?: string;
  synopsis: string;
  quote: string;
  whyYouWillLoveIt: string;
  moodTags: string[];
  coverGradient: string;
  coverImage?: string;
  coverTextColor: string;
  coverPattern?: string;
  readersActive?: number;
  isbn: string;
}

export interface MoodCategory {
  id: string;
  label: string;
  iconName: string;
  description: string;
  tagline: string;
  curatedBookIds: string[];
}

export interface MarginNoteComment {
  id: string;
  readerName: string;
  readerAvatar?: string;
  text: string;
  createdAt: string;
}

export interface MarginNote {
  id: string;
  readerName: string;
  readerHandle?: string;
  readerAvatar?: string;
  bookTitle: string;
  bookAuthor?: string;
  pageNumber?: number;
  passageSnippet: string;
  noteText: string;
  likes: number;
  timestamp: string;
  isStaffPick?: boolean;
  isTopPick?: boolean;
  comments?: MarginNoteComment[];
  userId?: string;
}


export interface ReadingCircle {
  id: string;
  name: string;
  currentBook: string;
  author: string;
  membersCount: number;
  meetingDate: string;
  topic: string;
  coverGradient: string;
  coverImage?: string;
  founderEmail?: string;
  founderName?: string;
  joinedEmails?: string[];
  createdAt?: string;
}

export interface ChapterMeta {
  index: number;
  romanNumeral: string;
  title: string;
  subtitle: string;
}
