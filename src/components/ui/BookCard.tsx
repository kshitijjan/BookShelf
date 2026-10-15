import React from 'react';
import { Star, Bookmark, ArrowUpRight } from 'lucide-react';
import { Book } from '../../types/book';
import { BookCover } from './BookCover';
import { Badge } from './Badge';
import { formatCompactNumber } from '../../utils/formatters';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  isBookmarked: boolean;
  onToggleBookmark: (bookId: string) => void;
  featuredBadge?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  featuredBadge,
}) => {
  return (
    <div
      onClick={() => onSelect(book)}
      className="group relative bg-[#f7f4ed] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-book-sheet"
    >
      <div>
        {/* Top Badges & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="subtle">{book.genre}</Badge>
            {featuredBadge && (
              <Badge variant="dark">{featuredBadge}</Badge>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(book.id);
            }}
            className="p-1.5 rounded-full hover:bg-[rgba(28,28,28,0.06)] text-[#1c1c1c] transition-colors"
            aria-label="Bookmark"
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? 'fill-[#1c1c1c]' : 'text-[#5f5f5d]'}`}
            />
          </button>
        </div>

        {/* Book Visual & Info */}
        <div className="flex gap-4 items-start mb-3">
          <BookCover book={book} size="sm" />
          <div className="flex-1 min-w-0">
            <h3 className="font-editorial text-[17px] font-medium text-[#1c1c1c] leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
              {book.title}
            </h3>
            <p className="text-[13px] text-[#5f5f5d] mt-0.5 line-clamp-1">
              {book.author}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#1c1c1c]">
              <Star className="w-3.5 h-3.5 fill-[#1c1c1c] text-[#1c1c1c]" />
              <span className="font-medium">{book.rating.toFixed(2)}</span>
              <span className="text-[#5f5f5d]">({formatCompactNumber(book.reviewCount)})</span>
            </div>

            {/* Mood tag preview */}
            <div className="mt-2.5 flex flex-wrap gap-1">
              {book.moodTags.slice(0, 1).map((m) => (
                <span key={m} className="text-[11px] text-[#5f5f5d] bg-[rgba(28,28,28,0.03)] px-2 py-0.5 rounded border border-[#eceae4]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Why You'll Love It Snippet */}
        <p className="text-[12px] text-[rgba(28,28,28,0.82)] line-clamp-2 italic font-serif-quote bg-[#fbf9f4] p-2.5 rounded-[6px] border border-[#eceae4] mb-2">
          "{book.whyYouWillLoveIt}"
        </p>
      </div>

      {/* Bottom Inspect Link */}
      <div className="pt-2 border-t border-[#eceae4] flex items-center justify-between text-[12px] text-[#5f5f5d] group-hover:text-[#1c1c1c] transition-colors">
        <span>{book.pages} pages • {book.year}</span>
        <span className="inline-flex items-center gap-0.5 font-medium">
          Examine Volume <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </div>
  );
};
