import React, { useState, useEffect } from 'react';
import { Book } from '../../types/book';

interface BookCoverProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(book.coverImage);

  // Reset image error and source whenever book changes
  useEffect(() => {
    setImageError(false);
    setCurrentSrc(book.coverImage);
  }, [book.id, book.coverImage]);

  const handleImageError = () => {
    // If external URL failed in the browser, retry via our backend proxy
    if (
      currentSrc &&
      currentSrc.startsWith('http') &&
      !currentSrc.includes('/api/cover-proxy')
    ) {
      setCurrentSrc(`/api/cover-proxy?url=${encodeURIComponent(currentSrc)}`);
    } else {
      setImageError(true);
    }
  };

  const dimensions = {
    sm: 'w-[100px] h-[145px] text-[10px]',
    md: 'w-[140px] h-[205px] text-[12px]',
    lg: 'w-[190px] h-[280px] text-[14px]',
  };

  const showImage = Boolean(currentSrc) && !imageError;

  return (
    <div
      className={`relative select-none rounded-[4px] overflow-hidden shadow-book-sheet transition-transform duration-300 group-hover:scale-[1.02] flex flex-col justify-between ${!showImage ? 'p-3.5 bg-gradient-to-br ' + book.coverGradient : ''} ${dimensions[size]} ${className}`}
      style={{
        boxShadow: '2px 4px 12px rgba(28,28,28,0.18), inset -2px 0 6px rgba(0,0,0,0.25), inset 3px 0 4px rgba(255,255,255,0.1)'
      }}
    >
      {showImage ? (
        <img 
          src={currentSrc} 
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />
      ) : (
        <>
          {/* Surface Pattern Overlay */}
          {book.coverPattern && (
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: book.coverPattern }}
            />
          )}

          {/* Book Title & Ornament */}
          <div className="relative z-10 pl-2">
            <div className="w-4 h-[1px] bg-current opacity-30 mb-2" />
            <h4
              className="font-serif-quote font-medium leading-tight tracking-tight line-clamp-3"
              style={{ color: book.coverTextColor }}
            >
              {book.title}
            </h4>
          </div>

          {/* Author & Subtle Logo */}
          <div className="relative z-10 pl-2 pt-2 border-t border-white/10 flex items-end justify-between">
            <p
              className="text-[11px] font-sans tracking-wide opacity-80 uppercase line-clamp-1"
              style={{ color: book.coverTextColor }}
            >
              {book.author}
            </p>
            <span
              className="text-[9px] opacity-40 uppercase tracking-widest font-mono"
              style={{ color: book.coverTextColor }}
            >
              {book.year}
            </span>
          </div>
        </>
      )}

      {/* Gentle Gloss Highlight Sheen */}
      <div className="absolute z-20 inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );
};
