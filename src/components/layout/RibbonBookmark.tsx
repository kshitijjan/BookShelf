import React, { useState } from 'react';
import { Bookmark, ChevronDown, Check } from 'lucide-react';
import { CHAPTERS_LIST } from '../../data/booksData';
import { soundManager } from '../../utils/sound';

interface RibbonBookmarkProps {
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  isHomePage: boolean;
}

export const RibbonBookmark: React.FC<RibbonBookmarkProps> = ({
  currentChapterIndex,
  onSelectChapter,
  isHomePage,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (idx: number) => {
    soundManager.playBookmarkClick();
    onSelectChapter(idx);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Ribbon Tab Hanging from Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] bg-[#f7f4ed] border border-[#eceae4] hover:border-[rgba(28,28,28,0.4)] text-[#1c1c1c] transition-all shadow-button-inset"
        aria-label="Table of Contents Ribbon"
        title="Table of Contents Ribbon"
      >
        <Bookmark className="w-3.5 h-3.5 fill-[#8c5e43] text-[#8c5e43]" />
        <span className="font-normal hidden sm:inline">Index & Ribbon</span>
        <ChevronDown className={`w-3 h-3 text-[#5f5f5d] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#f7f4ed] border border-[#eceae4] rounded-container p-3 shadow-xl z-50 parchment-texture book-spine-left animate-fade-in">
            <div className="px-3 py-2 border-b border-[#eceae4] flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#5f5f5d] font-mono">
                Volume Index
              </span>
              <span className="text-[11px] text-[#8c5e43] font-medium">
                {isHomePage ? `Page ${currentChapterIndex + 1} of 5` : 'General Catalog'}
              </span>
            </div>

            <div className="py-1 space-y-1">
              {CHAPTERS_LIST.map((chapter) => {
                const isActive = isHomePage && currentChapterIndex === chapter.index;
                return (
                  <button
                    key={chapter.index}
                    onClick={() => handleSelect(chapter.index)}
                    className={`w-full text-left px-3 py-2 rounded-card text-[13px] flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[#eceae4] text-[#1c1c1c] font-medium'
                        : 'hover:bg-[rgba(28,28,28,0.04)] text-[#1c1c1c]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif-quote font-bold text-[#8c5e43] text-[12px]">
                          Chap. {chapter.romanNumeral}
                        </span>
                        <span className="text-[#1c1c1c]">{chapter.title}</span>
                      </div>
                      <p className="text-[11px] text-[#5f5f5d] pl-9 line-clamp-1">
                        {chapter.subtitle}
                      </p>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#1c1c1c]" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#eceae4] px-3 py-1 text-[11px] text-[#5f5f5d] flex justify-between">
              <span>Click chapter to navigate</span>
              <span className="text-[#1c1c1c]">Stacked Folio Mode</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
