import React from 'react';
import { soundManager } from '../../utils/sound';

interface PageCornerCurlProps {
  direction?: 'next' | 'prev';
  onTurn: () => void;
  disabled?: boolean;
}

export const PageCornerCurl: React.FC<PageCornerCurlProps> = ({
  direction = 'next',
  onTurn,
  disabled = false,
}) => {
  if (disabled) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playPageTurn();
    onTurn();
  };

  const isNext = direction === 'next';

  return (
    <div
      onClick={handleClick}
      className={`group absolute bottom-3 ${isNext ? 'right-3' : 'left-3'} z-20 cursor-pointer select-none p-2`}
      title={isNext ? 'Click corner to turn page' : 'Click corner to go back'}
    >
      <div className="relative w-10 h-10 overflow-hidden">
        {/* Subtle Dog-ear Triangle Curl */}
        <div
          className={`absolute bottom-0 ${isNext ? 'right-0' : 'left-0'} w-0 h-0 transition-all duration-300 group-hover:border-[22px] border-[14px] ${
            isNext
              ? 'border-r-[#e4dfd3] border-b-[#e4dfd3] border-t-transparent border-l-transparent'
              : 'border-l-[#e4dfd3] border-b-[#e4dfd3] border-t-transparent border-r-transparent'
          }`}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(28,28,28,0.12))',
          }}
        />

        {/* Diagonal Crease Shadow */}
        <div
          className={`absolute bottom-0 ${isNext ? 'right-0' : 'left-0'} w-8 h-8 pointer-events-none transition-opacity duration-300 opacity-40 group-hover:opacity-80`}
          style={{
            background: isNext
              ? 'linear-gradient(135deg, transparent 50%, rgba(28,28,28,0.12) 50%)'
              : 'linear-gradient(225deg, transparent 50%, rgba(28,28,28,0.12) 50%)',
          }}
        />
      </div>

      <span
        className={`absolute bottom-1 ${
          isNext ? 'right-11' : 'left-11'
        } text-[11px] font-mono text-[#5f5f5d] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:inline`}
      >
        {isNext ? 'Turn Page →' : '← Back'}
      </span>
    </div>
  );
};
