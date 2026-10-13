import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CHAPTERS_LIST } from '../../data/booksData';
import { soundManager } from '../../utils/sound';

interface PageNavigationControlsProps {
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

export const PageNavigationControls: React.FC<PageNavigationControlsProps> = ({
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onSelect,
}) => {
  const currentChapter = CHAPTERS_LIST[currentIndex];

  const handlePrev = () => {
    soundManager.playPageTurn();
    onPrev();
  };

  const handleNext = () => {
    soundManager.playPageTurn();
    onNext();
  };

  const handleDotClick = (i: number) => {
    soundManager.playPageTurn();
    onSelect(i);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 select-none animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 bg-[#f7f4ed]/95 backdrop-blur-md border border-[#eceae4] px-3 sm:px-4 py-2 rounded-full shadow-lg text-[13px] text-[#1c1c1c] book-sheet">
        {/* Prev Page Button */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[#1c1c1c] hover:bg-[#eceae4] disabled:opacity-30 disabled:hover:bg-transparent transition-all focus-warm"
          aria-label="Previous Page"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-normal">Prev</span>
        </button>

        {/* Divider */}
        <span className="h-4 w-[1px] bg-[#eceae4]" />

        {/* Current Chapter Tag & Dots */}
        <div className="flex items-center gap-2.5 px-1">
          <span className="font-serif-quote font-bold text-[#8c5e43] text-[13px]">
            {currentChapter?.romanNumeral || currentIndex + 1}
          </span>
          <span className="hidden md:inline text-[12px] text-[#5f5f5d]">
            {currentChapter?.title}
          </span>

          {/* Dots */}
          <div className="flex items-center gap-1.5 ml-1">
            {Array.from({ length: totalCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                aria-label={`Jump to page ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? 'w-4 h-1.5 bg-[#1c1c1c]'
                    : 'w-1.5 h-1.5 bg-[rgba(28,28,28,0.25)] hover:bg-[rgba(28,28,28,0.5)]'
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] font-mono text-[#5f5f5d] ml-1">
            {currentIndex + 1}/{totalCount}
          </span>
        </div>

        {/* Divider */}
        <span className="h-4 w-[1px] bg-[#eceae4]" />

        {/* Next Page Button */}
        <button
          onClick={handleNext}
          disabled={currentIndex === totalCount - 1}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[#1c1c1c] hover:bg-[#eceae4] disabled:opacity-30 disabled:hover:bg-transparent transition-all focus-warm"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline font-normal">Next</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
