import React, { useState, useEffect } from 'react';
import { Chapter1Hero } from '../components/home-chapters/Chapter1Hero';
import { Chapter2CuratedShelf } from '../components/home-chapters/Chapter2CuratedShelf';
import { Chapter3MoodMatcher } from '../components/home-chapters/Chapter3MoodMatcher';
import { Chapter4MarginNotes } from '../components/home-chapters/Chapter4MarginNotes';
import { Chapter5Colophon } from '../components/home-chapters/Chapter5Colophon';
import { BookDetailModal } from '../components/books/BookDetailModal';
import { Book } from '../types/book';
import { soundManager } from '../utils/sound';

interface HomePageProps {
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentPageIndex: _currentPageIndex,
  onPageChange,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Sync scroll position with active chapter index for RibbonBookmark & Navbar
  useEffect(() => {
    const chapterIds = ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = chapterIds.indexOf(entry.target.id);
            if (idx !== -1) {
              onPageChange(idx);
            }
          }
        });
      },
      { threshold: 0.25, rootMargin: '-70px 0px -40% 0px' }
    );

    chapterIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [onPageChange]);

  const scrollToChapter = (chapterNum: number) => {
    soundManager.playPageTurn();
    const target = document.getElementById(`chapter-${chapterNum}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onPageChange(chapterNum - 1);
  };

  const handleSearchPrompt = (query: string) => {
    scrollToChapter(3);
    console.log('Searching for vibe:', query);
  };

  return (
    <>
      {/* Vertically stacked chapters flow with identical page styling */}
      <div className="min-h-screen pt-20 pb-28 px-3 sm:px-6 max-w-5xl mx-auto space-y-12 sm:space-y-16">
        <section id="chapter-1" className="scroll-mt-20">
          <Chapter1Hero
            onNextPage={() => scrollToChapter(2)}
            onSearchPrompt={handleSearchPrompt}
          />
        </section>

        <section id="chapter-2" className="scroll-mt-20">
          <Chapter2CuratedShelf
            onNextPage={() => scrollToChapter(3)}
            onPrevPage={() => scrollToChapter(1)}
            onSelectBook={setSelectedBook}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={onToggleBookmark}
          />
        </section>

        <section id="chapter-3" className="scroll-mt-20">
          <Chapter3MoodMatcher
            onNextPage={() => scrollToChapter(4)}
            onPrevPage={() => scrollToChapter(2)}
            onSelectBook={setSelectedBook}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={onToggleBookmark}
          />
        </section>

        <section id="chapter-4" className="scroll-mt-20">
          <Chapter4MarginNotes
            onNextPage={() => scrollToChapter(5)}
            onPrevPage={() => scrollToChapter(3)}
          />
        </section>

        <section id="chapter-5" className="scroll-mt-20">
          <Chapter5Colophon
            onPrevPage={() => scrollToChapter(4)}
            onResetToStart={() => scrollToChapter(1)}
          />
        </section>
      </div>

      {/* Book Inspection Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          isBookmarked={bookmarkedIds.includes(selectedBook.id)}
          onToggleBookmark={onToggleBookmark}
        />
      )}
    </>
  );
};
