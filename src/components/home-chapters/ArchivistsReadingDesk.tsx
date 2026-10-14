import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Feather, Bookmark, X, BookOpen, ArrowUpRight, Star } from 'lucide-react';
import { Book } from '../../types/book';
import { ArchivistResult } from '../../utils/archivistEngine';
import { BookCover } from '../ui/BookCover';
import { soundManager } from '../../utils/sound';

interface ArchivistsReadingDeskProps {
  result: ArchivistResult;
  onClose: () => void;
  onSelectBook: (book: Book) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (bookId: string) => void;
  onResetQuery: () => void;
}

export const ArchivistsReadingDesk: React.FC<ArchivistsReadingDeskProps> = ({
  result,
  onClose,
  onSelectBook,
  bookmarkedIds,
  onToggleBookmark,
  onResetQuery,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mt-6 bg-[#fcfaf5] border-2 border-[#8c5e43]/30 rounded-card p-5 sm:p-6 shadow-book-sheet relative overflow-hidden"
    >
      {/* Decorative Ornate Corner Borders */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#8c5e43]/40 pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#8c5e43]/40 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#8c5e43]/40 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#8c5e43]/40 pointer-events-none" />

      {/* Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eceae4] gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-[#8c5e43]/10 border border-[#8c5e43]/20 text-[#8c5e43]">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-quote font-bold text-[#1c1c1c] text-[16px] sm:text-[17px] tracking-wide">
                The Archivist’s Reading Desk
              </span>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#8c5e43]/10 text-[#8c5e43] border border-[#8c5e43]/20">
                Live Accord
              </span>
            </div>
            <p className="text-[12px] text-[#5f5f5d] font-mono mt-0.5">
              Inscribed inquiry: <span className="text-[#1c1c1c] italic">“{result.query}”</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playPageTurn();
            onClose();
          }}
          className="self-end sm:self-auto inline-flex items-center gap-1.5 text-[12px] text-[#5f5f5d] hover:text-[#1c1c1c] bg-[#f7f4ed] hover:bg-[#eceae4] px-2.5 py-1 rounded-full border border-[#eceae4] transition-colors"
          title="Fold the desk"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss Desk</span>
        </button>
      </div>

      {/* The Archivist's Epigraph Dispatch */}
      <div className="my-4 p-3.5 sm:p-4 rounded-[6px] bg-[#f7f4ed]/70 border-l-2 border-[#8c5e43] text-[14px] leading-relaxed">
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#8c5e43] font-semibold mb-1">
          <Sparkles className="w-3 h-3 text-[#8c5e43]" />
          <span>Archivist’s Epigraph</span>
        </div>
        <p className="font-serif-quote italic text-[#2c221a] text-[15px] sm:text-[16px]">
          {result.letter}
        </p>
      </div>

      {/* 3 Curated Volume Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {result.recommendations.map((rec) => {
          const isBookmarked = bookmarkedIds.includes(rec.book.id);

          return (
            <div
              key={rec.book.id}
              className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[#8c5e43]/40 rounded-card p-3.5 flex flex-col justify-between transition-all hover:shadow-md group relative"
            >
              {/* Match Badge */}
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1c1c1c] text-[#fcfbf8] font-medium">
                  {rec.badge}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playBookmarkClick();
                    onToggleBookmark(rec.book.id);
                  }}
                  className={`p-1 rounded-full transition-colors ${
                    isBookmarked
                      ? 'text-[#8c5e43] bg-[#8c5e43]/10'
                      : 'text-[#5f5f5d] hover:text-[#1c1c1c] hover:bg-[rgba(28,28,28,0.05)]'
                  }`}
                  title={isBookmarked ? 'Bookmarked' : 'Add bookmark'}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              {/* Cover & Title Details */}
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 cursor-pointer"
                  onClick={() => {
                    soundManager.playPageTurn();
                    onSelectBook(rec.book);
                  }}
                >
                  <BookCover book={rec.book} size="sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono uppercase text-[#8c5e43] tracking-wide block truncate">
                    {rec.book.genre}
                  </span>
                  <h4
                    onClick={() => {
                      soundManager.playPageTurn();
                      onSelectBook(rec.book);
                    }}
                    className="font-serif-quote font-bold text-[15px] text-[#1c1c1c] leading-tight mt-0.5 line-clamp-2 hover:underline cursor-pointer"
                  >
                    {rec.book.title}
                  </h4>
                  <p className="text-[12px] text-[#5f5f5d] mt-0.5 truncate">
                    {rec.book.author}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-[#5f5f5d] font-mono mt-2">
                    <span className="flex items-center gap-0.5 text-[#1c1c1c] font-medium">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {rec.book.rating}
                    </span>
                    <span>•</span>
                    <span>{rec.book.pages}p</span>
                    <span>•</span>
                    <span>{rec.book.year}</span>
                  </div>
                </div>
              </div>

              {/* The Archivist's Tailored Rationale */}
              <div className="mt-3 pt-2.5 border-t border-[#eceae4]/80 flex-1">
                <p className="text-[12px] text-[#2c221a]/90 font-serif-quote italic leading-snug">
                  “{rec.rationale}”
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2 border-t border-[#eceae4]/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPageTurn();
                    onSelectBook(rec.book);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-[#1c1c1c] text-[#fcfbf8] hover:bg-[#333] text-[12px] font-medium transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Examine Volume</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desk Footer Ribbon */}
      <div className="mt-5 pt-3 border-t border-[#eceae4] flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-[#5f5f5d]">
        <span>
          Retrieved from the 30-volume Sanctuary Vault. Select any volume to inspect margin reflections.
        </span>

        <button
          onClick={() => {
            soundManager.playPageTurn();
            onResetQuery();
          }}
          className="text-[#8c5e43] hover:underline font-medium shrink-0"
        >
          ✦ Inscribe another inquiry
        </button>
      </div>
    </motion.div>
  );
};
