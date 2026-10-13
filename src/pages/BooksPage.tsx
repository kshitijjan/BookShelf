import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, BookOpen, Loader2 } from 'lucide-react';
import { BookCard } from '../components/ui/BookCard';
import { BookCardSkeleton } from '../components/ui/BookCardSkeleton';
import { BookDetailModal } from '../components/books/BookDetailModal';
import { Book } from '../types/book';
import { BOOKS_DATA } from '../data/booksData';
import { searchBooks } from '../services/openLibrary';

interface BooksPageProps {
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
}

const DAILY_GENRES_LIST = [
  'All',
  'Top Classics',
  'Best Fiction',
  'Self-Help & Personal Growth',
  'Business Management & Leadership',
  'Startups & Entrepreneurship',
  'Money, Investing & Stock Market',
  'Philosophy',
  'Psychology',
  'Biography & Memoir',
  'Tech & AI'
];

export const BooksPage: React.FC<BooksPageProps> = ({
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'year' | 'pages'>('relevance');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleSelectBook = (book: Book | null) => {
    setSelectedBook(book);
    const newParams = new URLSearchParams(searchParams);
    if (book) {
      newParams.set('book', book.id);
      if (book.title) newParams.set('title', book.title);
    } else {
      newParams.delete('book');
      newParams.delete('title');
    }
    setSearchParams(newParams, { replace: true });
  };
  
  // Instant render: initialize with cached daily books or BOOKS_DATA (0ms load!)
  const [dailyCatalog, setDailyCatalog] = useState<Book[]>(() => {
    try {
      const cached = sessionStorage.getItem('bookshelf_daily_catalog');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.books && Array.isArray(parsed.books) && parsed.books.length > 0) {
          return parsed.books;
        }
      }
    } catch {
      // ignore storage errors
    }
    return BOOKS_DATA;
  });

  const [isDailyView, setIsDailyView] = useState(true);
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Typeahead States
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch today's verified 30-book catalog from Neon DB / API on mount
  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const res = await fetch('/api/books/daily');
        if (!res.ok) throw new Error('Failed to load daily books');
        const data = await res.json();
        if (data.books && Array.isArray(data.books) && data.books.length > 0) {
          setDailyCatalog(data.books);
          sessionStorage.setItem('bookshelf_daily_catalog', JSON.stringify({
            dateKey: data.dateKey,
            books: data.books,
          }));
        }
      } catch (err) {
        console.warn('[BooksPage] Using initial daily catalog fallback:', err);
      }
    };

    fetchDaily();
  }, []);

  // Close typeahead when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Deep link or search param handling
  useEffect(() => {
    const bookParam = searchParams.get('book');
    const titleParam = searchParams.get('title');
    if (bookParam || titleParam) {
      // 1. Check daily catalog
      let found = dailyCatalog.find(b => 
        (bookParam && b.id === bookParam) || 
        (titleParam && b.title.toLowerCase() === titleParam.toLowerCase()) ||
        (bookParam && b.title.toLowerCase() === bookParam.toLowerCase())
      );

      // 2. Check static books catalog fallback
      if (!found) {
        found = BOOKS_DATA.find(b => 
          (bookParam && b.id === bookParam) || 
          (titleParam && b.title.toLowerCase() === titleParam.toLowerCase()) ||
          (bookParam && b.title.toLowerCase() === bookParam.toLowerCase())
        );
      }

      if (found) {
        setSelectedBook(found);
      } else {
        const query = titleParam || bookParam || '';
        if (query) {
          setSearchInput(query);
          setIsLoading(true);
          searchBooks(query).then(results => {
            setSearchedBooks(results);
            setIsDailyView(false);
            if (results.length > 0) {
              const matched = (bookParam && results.find(r => r.id === bookParam)) || results[0];
              setSelectedBook(matched);
            }
            setIsLoading(false);
          }).catch(err => {
            console.error('[BooksPage] Deep link search error:', err);
            setIsLoading(false);
          });
        }
      }
    }
  }, [searchParams, dailyCatalog]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);

    if (!searchInput.trim()) {
      setIsDailyView(true);
      return;
    }
    
    // First check if query matches items in the daily catalog
    const localMatches = dailyCatalog.filter(b => 
      b.title.toLowerCase().includes(searchInput.toLowerCase()) ||
      b.author.toLowerCase().includes(searchInput.toLowerCase())
    );

    if (localMatches.length > 0 && localMatches.length <= dailyCatalog.length) {
      setIsDailyView(true);
      return;
    }

    // Otherwise perform global search across Open Library archives
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchBooks(searchInput);
      setSearchedBooks(results);
      setIsDailyView(false);
      setSortBy('relevance');
    } catch (err) {
      setError('Failed to search the archives.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (!value.trim()) {
      setIsDailyView(true);
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.trim().length >= 2) {
      setShowSuggestions(true);
      // First populate suggestions from daily catalog (instant 0ms feedback)
      const localMatches = dailyCatalog.filter(b =>
        b.title.toLowerCase().includes(value.toLowerCase()) ||
        b.author.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      
      if (localMatches.length > 0) {
        setSuggestions(localMatches);
      }

      setIsFetchingSuggestions(true);
      searchTimeoutRef.current = setTimeout(() => {
        searchBooks(value).then(results => {
          setSuggestions(results.slice(0, 5));
          setIsFetchingSuggestions(false);
        }).catch(err => {
          console.error(err);
          setIsFetchingSuggestions(false);
        });
      }, 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsFetchingSuggestions(false);
    }
  };

  const handleSuggestionClick = (book: Book) => {
    setShowSuggestions(false);
    handleSelectBook(book);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setIsDailyView(true);
    setSearchInput('');
  };

  // Filter books to display
  const displayedBooks = useMemo(() => {
    if (!isDailyView) {
      return searchedBooks;
    }

    let list = dailyCatalog;

    // Filter by genre
    if (selectedGenre !== 'All') {
      list = list.filter(b => b.genre.toLowerCase() === selectedGenre.toLowerCase());
    }

    // Filter by local search query if present
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
      );
    }

    return list;
  }, [isDailyView, searchedBooks, dailyCatalog, selectedGenre, searchInput]);

  // Sort displayed books
  const sortedBooks = useMemo(() => {
    return [...displayedBooks].sort((a, b) => {
      if (sortBy === 'relevance') return 0;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'pages') return a.pages - b.pages;
      return 0;
    });
  }, [displayedBooks, sortBy]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#eceae4] pb-6 mb-8">
        <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-[#8c5e43] mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>The Sanctuary Archive</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#1c1c1c] tracking-tight-section">
          The Literary Vault
        </h1>
        <p className="text-[16px] text-[#5f5f5d] mt-1 max-w-2xl">
          A curated sanctuary of transcendent works, timeless philosophy, and modern essentials for the thoughtful reader.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#fcfbf8] border border-[#eceae4] rounded-card p-4 sm:p-5 mb-8 shadow-book-sheet space-y-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          
          {/* Search Box with Typeahead */}
          <div className="relative flex-1" ref={searchContainerRef}>
            <Search className="w-4 h-4 text-[#5f5f5d] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={handleInputChange}
              onFocus={() => {
                if (searchInput.trim().length >= 2) setShowSuggestions(true);
              }}
              placeholder="Search by title, author, or keyword... (Press Enter to search all Open Library)"
              className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-standard pl-10 pr-4 py-2.5 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
            />
            
            {/* Typeahead Suggestions Dropdown */}
            {showSuggestions && searchInput.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#fcfbf8] border border-[#eceae4] rounded-card shadow-xl z-30 max-h-80 overflow-y-auto overflow-x-hidden">
                {isFetchingSuggestions && suggestions.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-[#5f5f5d] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8c5e43]" />
                    <span>Searching archives...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map(book => (
                      <li key={book.id}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionClick(book)}
                          className="w-full text-left px-4 py-2 hover:bg-[#f7f4ed] flex items-center gap-3 transition-colors border-b border-[#eceae4] last:border-0"
                        >
                          {book.coverImage ? (
                            <img src={book.coverImage} alt="" className="w-8 h-12 object-cover rounded-[2px] shadow-sm" />
                          ) : (
                            <div className="w-8 h-12 rounded-[2px] shadow-sm bg-gradient-to-br from-[#2d3748] to-[#1a202c]" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-[#1c1c1c] truncate">{book.title}</div>
                            <div className="text-[12px] text-[#5f5f5d] truncate">{book.author} • {book.year}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-[13px] text-[#5f5f5d]">
                    No quick matches found. Press Enter to search global archives.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#5f5f5d]" />
            <span className="text-[13px] text-[#5f5f5d]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'rating' | 'year' | 'pages')}
              className="bg-[#f7f4ed] border border-[#eceae4] rounded-standard px-3 py-2.5 text-[13px] text-[#1c1c1c] focus-warm"
            >
              <option value="relevance">Curator's Order</option>
              <option value="rating">Highest Rated</option>
              <option value="year">Publication Year</option>
              <option value="pages">Shortest to Longest</option>
            </select>
          </div>
        </form>

        {/* Genre Shelves - Fully visible multi-line wrap with zero slider */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#eceae4]/70">
          <span className="text-[12px] font-mono uppercase text-[#5f5f5d] mr-1.5 shrink-0">Genres:</span>
          {DAILY_GENRES_LIST.map((g) => {
            const count = g === 'All' 
              ? dailyCatalog.length 
              : dailyCatalog.filter(b => b.genre.toLowerCase() === g.toLowerCase()).length;
            const isSelected = selectedGenre === g && !searchInput;

            return (
              <button
                key={g}
                onClick={() => handleGenreChange(g)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] transition-colors border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                    : 'bg-[#f7f4ed] text-[rgba(28,28,28,0.8)] border-[#eceae4] hover:bg-[#eceae4]'
                }`}
              >
                <span>{g}</span>
                {count > 0 && (
                  <span className={`text-[11px] font-mono ${isSelected ? 'text-white/70' : 'text-[#8c5e43]'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 border border-dashed border-red-200 rounded-card bg-red-50">
          <h3 className="text-lg font-medium text-red-800 mb-2">{error}</h3>
          <button onClick={() => setIsDailyView(true)} className="text-[14px] text-red-600 underline">Back to Daily Vault</button>
        </div>
      ) : sortedBooks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#eceae4] rounded-card bg-[#fcfbf8]">
          <BookOpen className="w-8 h-8 text-[#5f5f5d] mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-medium text-[#1c1c1c]">No volumes match your criteria</h3>
          <p className="text-[14px] text-[#5f5f5d] mt-1">Try resetting your search query or genre filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={handleSelectBook}
              isBookmarked={bookmarkedIds.includes(book.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}

      {/* Book Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => handleSelectBook(null)}
          isBookmarked={bookmarkedIds.includes(selectedBook.id)}
          onToggleBookmark={onToggleBookmark}
        />
      )}
    </div>
  );
};
