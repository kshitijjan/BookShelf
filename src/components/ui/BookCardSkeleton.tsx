import React from 'react';

export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-[#f7f4ed] border border-[#eceae4] rounded-card p-4 flex flex-col justify-between animate-pulse">
      <div>
        {/* Top Badges & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="w-16 h-5 bg-[#eceae4] rounded-full" />
          <div className="w-5 h-5 bg-[#eceae4] rounded-full" />
        </div>

        {/* Book Visual & Info */}
        <div className="flex gap-4 items-start mb-3">
          <div className="w-[100px] h-[145px] bg-[#eceae4] rounded-[3px] shrink-0 shadow-sm" />
          <div className="flex-1 space-y-2 py-1">
            <div className="w-4/5 h-4 bg-[#eceae4] rounded-[3px]" />
            <div className="w-3/5 h-3 bg-[#eceae4] rounded-[3px]" />
            <div className="w-2/5 h-3 bg-[#eceae4] rounded-[3px]" />
          </div>
        </div>

        {/* Synopsis skeleton */}
        <div className="space-y-1.5 mt-2">
          <div className="w-full h-3 bg-[#eceae4]/70 rounded-[2px]" />
          <div className="w-5/6 h-3 bg-[#eceae4]/70 rounded-[2px]" />
        </div>
      </div>

      {/* Footer Meta */}
      <div className="pt-3 border-t border-[#eceae4]/60 flex items-center justify-between mt-4">
        <div className="w-20 h-3 bg-[#eceae4] rounded-[2px]" />
        <div className="w-12 h-3 bg-[#eceae4] rounded-[2px]" />
      </div>
    </div>
  );
};
