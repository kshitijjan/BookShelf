import { Book } from './book';

export interface UserShelfBook {
  book: Book;
  status: 'read' | 'reading_list';
  yearRead?: number;
  dateAdded: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  scholarlyRank: string;
  personalities: string[];
  selectedGenres: string[];
  tasteProfile: string;
  memberSince: string;
  challengeGoal: number;
  booksRead: number;
  pagesRead: number;
  marginNotesCount: number;
  guildsJoined: number;
  isOnboarded: boolean;
  shelfBooks?: UserShelfBook[];
  joinedCircles?: string[];
}

export interface ScholarlyRankOption {
  id: string;
  title: string;
  description: string;
}

export interface PersonalityOption {
  id: string;
  title: string;
  iconName: string;
  description: string;
  quote: string;
}

export interface GenreOption {
  id: string;
  title: string;
  adjective: string;
  noun: string;
  description: string;
}
