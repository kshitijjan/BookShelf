import React, { useState, useEffect, useRef } from 'react';
import { X, Search, BookOpen, Bookmark, Loader2, Check } from 'lucide-react';
import { Book } from '../../types/book';
import { BOOKS_DATA } from '../../data/booksData';
import { searchBooks } from '../../services/openLibrary';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultYear: number;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  defaultYear,
}) => {
  const { user, addBookToShelf } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Book[]>(BOOKS_DATA.slice(0, 8));
  const [isSearching, setIsSearching] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [addedIds, setAddedIds] = useState<Record<string, string>>({}); // id -> status

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedYear(defaultYear);
  }, [defaultYear]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults(BOOKS_DATA.slice(0, 8));
      setIsSearching(false);
      return;
    }

    // Immediate local match
    const local = BOOKS_DATA.filter(
      (b) =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (local.length > 0) {
      setResults(local);
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchTerm.trim().length >= 3) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        searchBooks(searchTerm)
          .then((olResults) => {
            if (olResults.length > 0) {
              setResults(olResults.slice(0, 10));
            }
            setIsSearching(false);
          })
          .catch(() => {
            setIsSearching(false);
          });
      }, 400);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = (book: Book, status: 'read' | 'reading_list') => {
    addBookToShelf(book, status, status === 'read' ? selectedYear : undefined);
    setAddedIds((prev) => ({ ...prev, [book.id]: status }));
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#1c1c1c', '#eceae4', '#8c5e43'],
    });
  };

  const years = [2026, 2025, 2024, 2027, 2028];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#fcfbf8] border border-[#eceae4] rounded-container p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden parchment-texture"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#eceae4]">
          <div>
            <span className="text-[12px] font-mono uppercase tracking-widest text-[#8c5e43]">
              Personal Sanctuary Shelf
            </span>
            <h2 className="font-editorial text-2xl font-semibold text-[#1c1c1c]">
              Add Volume to Your Shelf
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[rgba(28,28,28,0.06)] text-[#1c1c1c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input & Year Selector */}
        <div className="pt-4 pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5f5f5d] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or keyword..."
                className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-standard pl-10 pr-4 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#8c5e43] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            <div className="flex items-center gap-2 bg-[#f7f4ed] border border-[#eceae4] px-3 py-1.5 rounded-standard">
              <span className="text-[12px] font-mono text-[#5f5f5d]">Year Read:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-mono text-[13px] text-[#1c1c1c] font-medium outline-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2 modal-scrollable">
          {results.length === 0 ? (
            <div className="text-center py-12 text-[#5f5f5d] text-[14px]">
              No volumes found matching "{searchTerm}". Try another search term.
            </div>
          ) : (
            results.map((book) => {
              const existing = user?.shelfBooks?.find((item) => item.book?.id === book.id);
              const status = addedIds[book.id] || existing?.status;
              const yearRead = existing?.yearRead || selectedYear;

              return (
                <div
                  key={book.id}
                  className="p-3 bg-[#f7f4ed] border border-[#eceae4] rounded-card flex items-center justify-between gap-3 hover:border-[rgba(28,28,28,0.25)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt=""
                        className="w-10 h-14 object-cover rounded-[2px] shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-stone-300 rounded-[2px] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-medium text-[#1c1c1c] truncate">
                        {book.title}
                      </h4>
                      <p className="text-[12px] text-[#5f5f5d] truncate">
                        {book.author} • {book.pages} pages
                      </p>
                      <span className="text-[11px] font-mono text-[#8c5e43] uppercase">
                        {book.genre}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'read' ? (
                      <span className="text-[12px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Read in {yearRead}</span>
                      </span>
                    ) : status === 'reading_list' ? (
                      <span className="text-[12px] font-medium text-[#8c5e43] bg-[#fdfbf7] px-2.5 py-1 rounded-full border border-[#8c5e43] flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                        <span>In Reading List</span>
                      </span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAdd(book, 'read')}
                          className="text-[12px] gap-1 px-2.5 py-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read in {selectedYear}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="cream"
                          onClick={() => handleAdd(book, 'reading_list')}
                          className="text-[12px] gap-1 px-2.5 py-1"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Want to Read</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#eceae4] flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
