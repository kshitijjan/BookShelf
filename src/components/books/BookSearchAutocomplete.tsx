import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, BookOpen, Check, X } from 'lucide-react';
import { Book } from '../../types/book';
import { BOOKS_DATA } from '../../data/booksData';
import { searchBooks } from '../../services/openLibrary';

interface BookSearchAutocompleteProps {
  selectedTitle: string;
  selectedAuthor?: string;
  onSelect: (book: { title: string; author: string; coverImage?: string }) => void;
  required?: boolean;
  label?: string;
}

export const BookSearchAutocomplete: React.FC<BookSearchAutocompleteProps> = ({
  selectedTitle,
  selectedAuthor,
  onSelect,
  required = true,
  label = 'Book Volume',
}) => {
  const [query, setQuery] = useState(selectedTitle || '');
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal query if selectedTitle changes externally
  useEffect(() => {
    setQuery(selectedTitle || '');
  }, [selectedTitle]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get local catalog for instant 0ms suggestions
  const getLocalCatalog = (): Book[] => {
    try {
      const cached = sessionStorage.getItem('bookshelf_daily_catalog');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.books) && parsed.books.length > 0) {
          return parsed.books;
        }
      }
    } catch {
      // ignore
    }
    return BOOKS_DATA;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // If user clears or types custom text, still update parent
    onSelect({
      title: val,
      author: selectedAuthor || '',
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (val.trim().length >= 2) {
      setIsOpen(true);

      // Instant 0ms local match from daily catalog
      const localBooks = getLocalCatalog();
      const localMatches = localBooks.filter(
        (b) =>
          b.title.toLowerCase().includes(val.toLowerCase()) ||
          b.author.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);

      if (localMatches.length > 0) {
        setSuggestions(localMatches);
      }

      // Fetch from Open Library for comprehensive global search
      setIsLoading(true);
      timeoutRef.current = setTimeout(() => {
        searchBooks(val)
          .then((results) => {
            if (results && results.length > 0) {
              setSuggestions(results.slice(0, 6));
            } else if (localMatches.length === 0) {
              setSuggestions([]);
            }
          })
          .catch((err) => {
            console.warn('[BookSearchAutocomplete] Search error:', err);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (book: Book) => {
    setQuery(book.title);
    setIsOpen(false);
    onSelect({
      title: book.title,
      author: book.author,
      coverImage: book.coverImage,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onSelect({
      title: '',
      author: '',
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[12px] text-[#1c1c1c] font-medium">
          {label} {required && <span className="text-[#8c5e43]">*</span>}
        </label>
        {selectedAuthor && (
          <span className="text-[11px] text-[#8c5e43] font-mono truncate max-w-[200px]">
            by {selectedAuthor}
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#5f5f5d] absolute left-3 pointer-events-none" />
        <input
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search volume title or author... (e.g. Sisyphus, Solitude)"
          className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-standard pl-9 pr-9 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]/70"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8c5e43]" />}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#5f5f5d] hover:text-[#1c1c1c] p-0.5 rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Confirmation Banner */}
      {selectedAuthor && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#5f5f5d] bg-[rgba(28,28,28,0.03)] border border-[#eceae4] px-2.5 py-1 rounded">
          <Check className="w-3 h-3 text-[#8c5e43] shrink-0" />
          <span className="truncate">
            Selected volume by <strong className="text-[#1c1c1c] font-medium">{selectedAuthor}</strong>
          </span>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#fcfbf8] border border-[#eceae4] rounded-card shadow-2xl z-50 max-h-72 overflow-y-auto overflow-x-hidden animate-fade-in parchment-texture">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-[#5f5f5d] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#8c5e43]" />
              <span>Searching literary catalog...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#5f5f5d] border-b border-[#eceae4]/70">
                Matching Volumes
              </div>
              {suggestions.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(book)}
                  className="w-full text-left px-3 py-2 hover:bg-[#f7f4ed] flex items-center gap-3 transition-colors border-b border-[#eceae4]/60 last:border-0 group"
                >
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-7 h-10 object-cover rounded-[2px] shadow-sm shrink-0 border border-[#eceae4]"
                    />
                  ) : (
                    <div className="w-7 h-10 rounded-[2px] shadow-sm bg-[#1c1c1c] flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-[#eceae4]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#1c1c1c] group-hover:text-[#8c5e43] transition-colors truncate">
                      {book.title}
                    </div>
                    <div className="text-[11px] text-[#5f5f5d] truncate">
                      by <span className="text-[#1c1c1c]">{book.author}</span>
                      {book.year ? ` • ${book.year}` : ''}
                      {book.genre ? ` • ${book.genre}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-[12px] text-[#5f5f5d]">
              No exact match found in archives. Your custom volume title will be preserved.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
