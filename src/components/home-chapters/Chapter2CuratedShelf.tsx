import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Book } from '../../types/book';
import { BOOKS_DATA } from '../../data/booksData';
import { BookCard } from '../ui/BookCard';
import { soundManager } from '../../utils/sound';

interface Chapter2CuratedShelfProps {
  onNextPage: () => void;
  onPrevPage: () => void;
  onSelectBook: (book: Book) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (bookId: string) => void;
}

export const Chapter2CuratedShelf: React.FC<Chapter2CuratedShelfProps> = ({
  onNextPage,
  onPrevPage,
  onSelectBook,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  const genres = ['All', 'Speculative Fiction', 'Contemporary Fiction', 'Gothic Mystery', 'Philosophical Memoir', 'Literary Fantasy'];

  const filteredBooks = selectedGenre === 'All'
    ? BOOKS_DATA
    : BOOKS_DATA.filter(b => b.genre.toLowerCase().includes(selectedGenre.toLowerCase()) || b.secondaryGenre?.toLowerCase().includes(selectedGenre.toLowerCase()));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 sm:py-10 px-4 sm:px-8 max-w-5xl mx-auto parchment-texture book-spine-left book-edge-sheets rounded-container border border-[#eceae4]">
      {/* Chapter Header */}
      <div className="flex items-center justify-between border-b border-[#eceae4] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-serif-quote text-[13px] text-[#8c5e43] font-bold tracking-widest uppercase">
            Chapter II
          </span>
          <span className="text-[#eceae4]">•</span>
          <span className="text-[12px] uppercase tracking-wider text-[#5f5f5d] font-mono">
            The Curator’s Shelf
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#5f5f5d] font-mono">
          <span>Curated Harvest</span>
          <span className="text-[#eceae4]">•</span>
          <span>Folio 02</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c1c] tracking-tight-section">
              Handpicked Volumes of Rare Resonance
            </h2>
            <p className="text-[15px] text-[#5f5f5d] mt-1">
              Six masterpieces chosen for extraordinary voice, psychological depth, and unforgettable craft.
            </p>
          </div>

          {/* AI Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(28,28,28,0.03)] border border-[#eceae4] text-[12px] text-[#1c1c1c] shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#8c5e43]" />
            <span>Updated Daily by BookShelf AI</span>
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-[13px] whitespace-nowrap transition-colors border ${
                selectedGenre === g
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                  : 'bg-[#f7f4ed] text-[rgba(28,28,28,0.8)] border-[#eceae4] hover:bg-[#eceae4]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-2">
          {filteredBooks.slice(0, 6).map((book, idx) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={onSelectBook}
              isBookmarked={bookmarkedIds.includes(book.id)}
              onToggleBookmark={onToggleBookmark}
              featuredBadge={idx === 0 ? 'Featured Masterpiece' : idx === 1 ? 'Editor’s Choice' : undefined}
            />
          ))}
        </div>
      </div>

      {/* Chapter Footer Navigation */}
      <div className="pt-6 border-t border-[#eceae4] flex items-center justify-between mt-8 text-[14px]">
        <button
          onClick={() => {
            soundManager.playPageTurn();
            onPrevPage();
          }}
          className="inline-flex items-center gap-1.5 text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Chapter I: The Foreword</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPageTurn();
            onNextPage();
          }}
          className="inline-flex items-center gap-1.5 font-medium text-[#1c1c1c] hover:underline underline-offset-4 group transition-colors"
        >
          <span>Chapter III: The Taste Alchemist →</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
