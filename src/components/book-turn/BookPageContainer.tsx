import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageCornerCurl } from './PageCornerCurl';
import { PageNavigationControls } from './PageNavigationControls';
import { soundManager } from '../../utils/sound';

interface BookPageContainerProps {
  currentPageIndex: number;
  totalCount: number;
  onPageChange: (newIndex: number) => void;
  children: React.ReactNode[];
}

export const BookPageContainer: React.FC<BookPageContainerProps> = ({
  currentPageIndex,
  totalCount,
  onPageChange,
  children,
}) => {
  const [direction, setDirection] = useState<number>(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef<boolean>(false);



  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const goToNext = useCallback(() => {
    if (currentPageIndex < totalCount - 1 && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setDirection(1);
      soundManager.playPageTurn();
      onPageChange(currentPageIndex + 1);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 700);
    }
  }, [currentPageIndex, totalCount, onPageChange]);

  const goToPrev = useCallback(() => {
    if (currentPageIndex > 0 && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setDirection(-1);
      soundManager.playPageTurn();
      onPageChange(currentPageIndex - 1);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 700);
    }
  }, [currentPageIndex, onPageChange]);

  const goToIndex = useCallback((index: number) => {
    if (index !== currentPageIndex && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setDirection(index > currentPageIndex ? 1 : -1);
      soundManager.playPageTurn();
      onPageChange(index);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 700);
    }
  }, [currentPageIndex, onPageChange]);

  // Reset scroll position to top when page changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const frame = requestAnimationFrame(() => {
      el.scrollTop = 0;
    });

    return () => cancelAnimationFrame(frame);
  }, [currentPageIndex]);

  // Keyboard navigation (Left/Right arrow turn pages, Up/Down scroll naturally)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (isTransitioningRef.current) return;

      const el = scrollContainerRef.current;
      if (!el) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch Swipe navigation (Horizontal swipe only for page turns)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isTransitioningRef.current) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    // Horizontal swipe: explicit page turn (swipe left for next, swipe right for prev)
    if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < -80) goToNext();
      else if (deltaX > 80) goToPrev();
    }
  };


  // 3D Page Turn Animation Variants
  const pageTurnVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 32 : -32,
      opacity: 0,
      scale: 0.97,
      x: dir > 0 ? 40 : -40,
      filter: 'blur(1px)',
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -32 : 32,
      opacity: 0,
      scale: 0.97,
      x: dir > 0 ? -40 : 40,
      filter: 'blur(1px)',
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div className="relative min-h-screen">
      {/* Scrollable Viewport below fixed Navbar */}
      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed top-16 bottom-0 left-0 right-0 overflow-y-auto overflow-x-hidden book-perspective scroll-smooth"
      >
        <div className="min-h-full py-6 pb-28 px-2 sm:px-6 relative">
          {/* Background Decorative Book Stack Lines */}
          <div className="absolute top-6 bottom-24 left-4 right-4 pointer-events-none -z-10 hidden sm:block">
            <div className="w-full h-full max-w-5xl mx-auto rounded-container border border-[#eceae4]/60 bg-[#f4f0e6]/40 transform translate-y-1.5 translate-x-1.5" />
            <div className="w-full h-full max-w-5xl mx-auto rounded-container border border-[#eceae4]/40 bg-[#eee9dc]/30 transform translate-y-3 translate-x-3 -mt-[calc(100vh-9rem)]" />
          </div>

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentPageIndex}
              custom={direction}
              variants={pageTurnVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full relative book-page-3d"
            >
              {children[currentPageIndex]}

              {/* Corner Curls on Active Page */}
              <PageCornerCurl
                direction="prev"
                onTurn={goToPrev}
                disabled={currentPageIndex === 0}
              />
              <PageCornerCurl
                direction="next"
                onTurn={goToNext}
                disabled={currentPageIndex === totalCount - 1}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Persistent Floating Bottom Pill Controls */}
      <PageNavigationControls
        currentIndex={currentPageIndex}
        totalCount={totalCount}
        onPrev={goToPrev}
        onNext={goToNext}
        onSelect={goToIndex}
      />
    </div>
  );
};

