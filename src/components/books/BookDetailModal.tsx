import React, { useState, useEffect } from 'react';
import { X, Star, Bookmark, Share2, Compass, Loader2, Check, Plus, BookOpen, Trash2, Calendar } from 'lucide-react';
import { Book } from '../../types/book';
import { BookCover } from '../ui/BookCover';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import confetti from 'canvas-confetti';
import { getBookDetailedSynopsis } from '../../services/openLibrary';
import { useAuth } from '../../context/AuthContext';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (bookId: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  isBookmarked,
  onToggleBookmark,
}) => {
  const { user, addBookToShelf, removeBookFromShelf, isSignedIn, openAuthModal } = useAuth();
  const [detailedSynopsis, setDetailedSynopsis] = useState<string | null>(null);
  const [isLoadingSynopsis, setIsLoadingSynopsis] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [copiedShare, setCopiedShare] = useState(false);

  const availableYears = [2026, 2025, 2024, 2027, 2028];

  const currentShelfItem = user?.shelfBooks?.find(item => item.book?.id === book?.id);
  const isRead = currentShelfItem?.status === 'read';
  const isReadingList = currentShelfItem?.status === 'reading_list';

  const handleShare = async () => {
    if (!book) return;

    // Generate full shareable URL with book parameters
    const origin = window.location.origin;
    const params = new URLSearchParams();
    params.set('book', book.id);
    if (book.title) {
      params.set('title', book.title);
    }
    const shareUrl = `${origin}/books?${params.toString()}`;

    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      } catch (err) {
        console.warn('Clipboard writeText failed, using fallback copy:', err);
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }

    setCopiedShare(true);
    setTimeout(() => {
      setCopiedShare(false);
    }, 2500);
  };

  useEffect(() => {
    if (book?.id) {
      let isMounted = true;
      setIsLoadingSynopsis(true);
      setDetailedSynopsis(null);
      setShowAddMenu(false);
      
      getBookDetailedSynopsis(book.id)
        .then(synopsis => {
          if (isMounted && synopsis) {
            setDetailedSynopsis(synopsis);
          }
          if (isMounted) {
            setIsLoadingSynopsis(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingSynopsis(false);
        });
        
      return () => { isMounted = false; };
    }
  }, [book?.id]);

  useEffect(() => {
    if (book) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [book]);

  if (!book) return null;

  const handleMarkAsRead = (year: number) => {
    if (!isSignedIn) {
      openAuthModal();
      return;
    }
    addBookToShelf(book, 'read', year);
    if (!isBookmarked) {
      onToggleBookmark(book.id);
    }
    setShowAddMenu(false);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#1c1c1c', '#eceae4', '#8c5e43']
    });
  };

  const handleAddToReadingList = () => {
    if (!isSignedIn) {
      openAuthModal();
      return;
    }
    addBookToShelf(book, 'reading_list');
    if (!isBookmarked) {
      onToggleBookmark(book.id);
    }
    setShowAddMenu(false);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#8c5e43', '#eceae4']
    });
  };

  const handleRemove = () => {
    removeBookFromShelf(book.id);
    if (isBookmarked) {
      onToggleBookmark(book.id);
    }
    setShowAddMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#f7f4ed] border border-[#eceae4] rounded-container shadow-2xl max-h-[90vh] flex flex-col overflow-hidden parchment-texture"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Top Bar with Close Button */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-5 pb-3 border-b border-[#eceae4]/70 shrink-0 bg-[#f7f4ed]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8c5e43] font-semibold">
              Volume Dossier
            </span>
            <span className="text-[#8c5e43]/40">•</span>
            <Badge variant="subtle">{book.genre}</Badge>
            {book.secondaryGenre && <Badge variant="outline">{book.secondaryGenre}</Badge>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[rgba(28,28,28,0.06)] text-[#1c1c1c] transition-colors -mr-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Book Details */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 modal-scrollable">
          <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-6 sm:gap-8 items-start">
            {/* Cover & Quick Stats */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <BookCover book={book} size="lg" />
              <div className="w-full bg-[#fdfbf7] p-3 rounded-card border border-[#eceae4] text-[13px] text-[#5f5f5d] space-y-1.5">
                <div className="flex justify-between">
                  <span>Published</span>
                  <span className="text-[#1c1c1c] font-medium">{book.year}</span>
                </div>
                <div className="flex justify-between">
                  <span>Length</span>
                  <span className="text-[#1c1c1c] font-medium">{book.pages} pages</span>
                </div>
                <div className="flex justify-between">
                  <span>ISBN</span>
                  <span className="text-[#1c1c1c] font-mono text-[11px]">{book.isbn}</span>
                </div>
              </div>
            </div>

            {/* Book Content */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight-sub text-[#1c1c1c]">
                  {book.title}
                </h2>
                <p className="text-[16px] text-[#5f5f5d] mt-1">
                  by <span className="text-[#1c1c1c] font-medium">{book.author}</span>
                </p>
              </div>

            {/* Rating Bar */}
            <div className="flex items-center gap-3 py-2 border-y border-[#eceae4] text-[14px]">
              <div className="flex items-center gap-1 text-[#1c1c1c] font-medium">
                <Star className="w-4 h-4 fill-[#1c1c1c] text-[#1c1c1c]" />
                <span>{book.rating.toFixed(2)}</span>
              </div>
              <span className="text-[#eceae4]">•</span>
              <span className="text-[#5f5f5d]">{book.reviewCount.toLocaleString()} reader ratings</span>
            </div>

            {/* AI Insight Pill */}
            <div className="bg-[rgba(28,28,28,0.03)] border border-[#eceae4] rounded-card p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1c1c1c] uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>Why You Will Love It</span>
              </div>
              <p className="text-[14px] text-[rgba(28,28,28,0.82)] leading-relaxed font-sans">
                {book.whyYouWillLoveIt}
              </p>
            </div>

            {/* Synopsis */}
            <div>
              <h4 className="text-[13px] font-medium uppercase tracking-wider text-[#5f5f5d] mb-1.5">
                Archival Synopsis
              </h4>
              {isLoadingSynopsis ? (
                <div className="flex items-center gap-2 text-[14px] text-[#5f5f5d] italic">
                  <Loader2 className="w-4 h-4 animate-spin" /> Retrieving full archival synopsis...
                </div>
              ) : (
                <p className="text-[14px] leading-relaxed text-[rgba(28,28,28,0.83)] whitespace-pre-wrap">
                  {detailedSynopsis || book.synopsis}
                </p>
              )}
            </div>

            {/* Pull Quote */}
            {book.quote && (
              <div className="border-l-2 border-[#1c1c1c] pl-3 py-1 italic font-serif-quote text-[15px] text-[#1c1c1c]">
                "{book.quote}"
              </div>
            )}

            {/* Add to Shelf & Actions */}
            <div className="relative pt-3 border-t border-[#eceae4] space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {isRead ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-standard bg-[#1c1c1c] text-[#fcfbf8] text-[13px] font-medium shadow-sm">
                      <Check className="w-4 h-4 text-[#8c5e43]" />
                      <span>Already Read ({currentShelfItem?.yearRead || 2026})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="text-[12px] text-[#5f5f5d] hover:text-[#1c1c1c] underline"
                    >
                      Change
                    </button>
                  </div>
                ) : isReadingList ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-standard bg-[#fdfbf7] border border-[#8c5e43] text-[#8c5e43] text-[13px] font-medium shadow-sm">
                      <Bookmark className="w-4 h-4 fill-current" />
                      <span>In Reading List</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="text-[12px] text-[#5f5f5d] hover:text-[#1c1c1c] underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="gap-2 shadow-button-inset"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Shelf</span>
                  </Button>
                )}

                <Button
                  variant="cream"
                  className={`gap-2 transition-all ${
                    copiedShare
                      ? 'text-[#8c5e43] border-[#8c5e43] bg-[#f7f4ed] font-medium shadow-sm'
                      : 'text-[#1c1c1c] hover:bg-[#eceae4]'
                  }`}
                  onClick={handleShare}
                  title="Copy shareable link for this book"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4 text-[#8c5e43]" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#5f5f5d]" />
                      <span>Share</span>
                    </>
                  )}
                </Button>

                {copiedShare && (
                  <span className="text-[12px] font-mono text-[#8c5e43] animate-fade-in flex items-center gap-1.5 bg-[#f7f4ed] px-2.5 py-1 rounded border border-[#eceae4]">
                    <Check className="w-3.5 h-3.5 text-[#8c5e43]" />
                    <span>Book URL copied to clipboard</span>
                  </span>
                )}
              </div>

              {/* Add Menu Popover / Card */}
              {showAddMenu && (
                <div className="p-4 bg-[#fcfbf8] border border-[#eceae4] rounded-card shadow-lg space-y-3 animate-fade-in">
                  <div className="text-[12px] font-mono uppercase tracking-wider text-[#8c5e43] font-semibold">
                    Add this volume to:
                  </div>

                  <div className="space-y-2">
                    {/* Option 1: Books Read (I've already read this) */}
                    <div className="p-3 bg-[#f7f4ed] rounded-standard border border-[#eceae4] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#1c1c1c]" />
                          <span className="text-[14px] font-medium text-[#1c1c1c]">I've already read this</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#5f5f5d]" />
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-[#fcfbf8] border border-[#eceae4] text-[12px] font-mono px-2 py-0.5 rounded text-[#1c1c1c]"
                          >
                            {availableYears.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-[12px] text-[#5f5f5d]">
                        Adds to your {selectedYear} bookshelf, updates your challenge progress and calculates {book.pages} pages read.
                      </p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleMarkAsRead(selectedYear)}
                        className="w-full text-[12px]"
                      >
                        Add to Books Read ({selectedYear})
                      </Button>
                    </div>

                    {/* Option 2: Reading List (Want to Read) */}
                    <div className="p-3 bg-[#f7f4ed] rounded-standard border border-[#eceae4] space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-[#8c5e43]" />
                        <span className="text-[14px] font-medium text-[#1c1c1c]">Reading List (Want to read)</span>
                      </div>
                      <p className="text-[12px] text-[#5f5f5d]">
                        Bookmark to your reading list to preserve and read later.
                      </p>
                      <Button
                        size="sm"
                        variant="cream"
                        onClick={handleAddToReadingList}
                        className="w-full text-[12px]"
                      >
                        Add to Reading List
                      </Button>
                    </div>

                    {/* Option to remove if on shelf */}
                    {currentShelfItem && (
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="w-full pt-1 text-center text-[12px] text-red-600 hover:underline flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove from shelf completely</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
