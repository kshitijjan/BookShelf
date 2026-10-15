import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Moon, Compass, Coffee, Sparkles, Flame, Feather, CheckCircle2 } from 'lucide-react';
import { Book } from '../../types/book';
import { MOOD_CATEGORIES, BOOKS_DATA } from '../../data/booksData';
import { BookCard } from '../ui/BookCard';
import { soundManager } from '../../utils/sound';

interface Chapter3MoodMatcherProps {
  onNextPage: () => void;
  onPrevPage: () => void;
  onSelectBook: (book: Book) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (bookId: string) => void;
}

export const Chapter3MoodMatcher: React.FC<Chapter3MoodMatcherProps> = ({
  onNextPage,
  onPrevPage,
  onSelectBook,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [selectedMoodId, setSelectedMoodId] = useState<string>('classics');

  const selectedCategory = MOOD_CATEGORIES.find(m => m.id === selectedMoodId) || MOOD_CATEGORIES[0];

  // Matched books for this mood
  const matchedBooks = BOOKS_DATA.filter(b => selectedCategory.curatedBookIds.includes(b.id));

  const getMoodIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon': return <Moon className="w-4 h-4" />;
      case 'Compass': return <Compass className="w-4 h-4" />;
      case 'Coffee': return <Coffee className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Feather': return <Feather className="w-4 h-4" />;
      default: return <Compass className="w-4 h-4" />;
    }
  };

  const handleSelectMood = (id: string) => {
    soundManager.playBookmarkClick();
    setSelectedMoodId(id);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 sm:py-10 px-4 sm:px-8 max-w-5xl mx-auto parchment-texture book-spine-left book-edge-sheets rounded-container border border-[#eceae4]">
      {/* Chapter Header */}
      <div className="flex items-center justify-between border-b border-[#eceae4] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-serif-quote text-[13px] text-[#8c5e43] font-bold tracking-widest uppercase">
            Chapter III
          </span>
          <span className="text-[#eceae4]">•</span>
          <span className="text-[12px] uppercase tracking-wider text-[#5f5f5d] font-mono">
            The Taste Alchemist
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#5f5f5d] font-mono">
          <span>Emotional Resonance</span>
          <span className="text-[#eceae4]">•</span>
          <span>Folio 03</span>
        </div>
      </div>

      {/* Main Section Content */}
      <div className="space-y-6 flex-1">
        <div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c1c] tracking-tight-section">
            Tune Into Your Current Frequency
          </h2>
          <p className="text-[15px] text-[#5f5f5d] mt-1 max-w-2xl">
            Great books don't just entertain—they calibrate your emotional landscape. Select the atmosphere your soul seeks right now.
          </p>
        </div>

        {/* Mood Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {MOOD_CATEGORIES.map((mood) => {
            const isSelected = mood.id === selectedMoodId;
            return (
              <button
                key={mood.id}
                onClick={() => handleSelectMood(mood.id)}
                className={`flex flex-col items-center text-center p-3 rounded-card border transition-all text-[12px] ${
                  isSelected
                    ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset scale-[1.02]'
                    : 'bg-[#fdfbf7] text-[#1c1c1c] border-[#eceae4] hover:bg-[#eceae4]'
                }`}
              >
                <div className={`p-2 rounded-full mb-2 ${isSelected ? 'bg-white/10' : 'bg-[rgba(28,28,28,0.04)]'}`}>
                  {getMoodIcon(mood.iconName)}
                </div>
                <span className="font-medium leading-tight">{mood.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Resonance Banner */}
        <div className="bg-[#fcfbf8] border border-[#eceae4] rounded-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-book-sheet">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c5e43]">
                Current Resonance
              </span>
              <span className="text-[#eceae4]">•</span>
              <span className="text-[13px] font-medium text-[#1c1c1c]">
                {selectedCategory.tagline}
              </span>
            </div>
            <p className="text-[13px] text-[#5f5f5d]">
              {selectedCategory.description}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-[#1c1c1c] bg-[rgba(28,28,28,0.04)] px-3 py-1 rounded-full border border-[#eceae4]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1c1c1c]" />
            <span>98.6% Algorithmic Match</span>
          </div>
        </div>

        {/* Matched Books Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {matchedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={onSelectBook}
              isBookmarked={bookmarkedIds.includes(book.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      </div>

      {/* Chapter Navigation Footer */}
      <div className="pt-6 border-t border-[#eceae4] flex items-center justify-between mt-8 text-[14px]">
        <button
          onClick={() => {
            soundManager.playPageTurn();
            onPrevPage();
          }}
          className="inline-flex items-center gap-1.5 text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Chapter II: Curator’s Shelf</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPageTurn();
            onNextPage();
          }}
          className="inline-flex items-center gap-1.5 font-medium text-[#1c1c1c] hover:underline underline-offset-4 group transition-colors"
        >
          <span>Chapter IV: Margin Notes & Community →</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
