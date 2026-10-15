import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Send, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { soundManager } from '../../utils/sound';

interface Chapter5ColophonProps {
  onPrevPage: () => void;
  onResetToStart: () => void;
}

export const Chapter5Colophon: React.FC<Chapter5ColophonProps> = ({
  onPrevPage,
  onResetToStart,
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubscribed(true);
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1c1c1c', '#eceae4', '#8c5e43']
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 sm:py-10 px-4 sm:px-8 max-w-5xl mx-auto parchment-texture book-spine-left book-edge-sheets rounded-container border border-[#eceae4]">
      {/* Chapter Header */}
      <div className="flex items-center justify-between border-b border-[#eceae4] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-serif-quote text-[13px] text-[#8c5e43] font-bold tracking-widest uppercase">
            Chapter V
          </span>
          <span className="text-[#eceae4]">•</span>
          <span className="text-[12px] uppercase tracking-wider text-[#5f5f5d] font-mono">
            The Colophon & Epilogue
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#5f5f5d] font-mono">
          <span>End of Volume 1</span>
          <span className="text-[#eceae4]">•</span>
          <span>Folio 05</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8 flex-1">
        <div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c1c] tracking-tight-section">
            The Literary Ledger & Colophon
          </h2>
          <p className="text-[15px] text-[#5f5f5d] mt-1 max-w-2xl">
            You have reached the end of this digital volume, but your journey through the library has merely begun.
          </p>
        </div>

        {/* Distinctive Stats Bar from DESIGN.md */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-[#eceae4]">
          <div className="space-y-1">
            <div className="font-editorial text-4xl sm:text-[46px] font-semibold text-[#1c1c1c] tracking-tight-section leading-none">
              2.4M+
            </div>
            <p className="text-[14px] text-[#5f5f5d]">
              Digital pages turned & explored by literary pilgrims this year.
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-editorial text-4xl sm:text-[46px] font-semibold text-[#1c1c1c] tracking-tight-section leading-none">
              48K+
            </div>
            <p className="text-[14px] text-[#5f5f5d]">
              Active reader salons, marginalia notes, and intimate book discussions.
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-editorial text-4xl sm:text-[46px] font-semibold text-[#1c1c1c] tracking-tight-section leading-none">
              99.4%
            </div>
            <p className="text-[14px] text-[#5f5f5d]">
              Taste affinity match score across curated psychological profiles.
            </p>
          </div>
        </div>

        {/* Newsletter Inscription Card */}
        <div className="bg-[#fcfbf8] border border-[#eceae4] rounded-card p-6 sm:p-8 shadow-book-sheet space-y-4">
          <div className="max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8c5e43]">
              The Sunday Dispatch
            </span>
            <h3 className="text-xl sm:text-2xl font-medium text-[#1c1c1c] mt-1 tracking-tight-sub">
              Receive one transcendent literary recommendation every dawn.
            </h3>
            <p className="text-[14px] text-[#5f5f5d] mt-1">
              No sponsored fluff. Just profound books, rare quotes, and thoughtfully translated passages.
            </p>
          </div>

          {isSubscribed ? (
            <div className="flex items-center gap-2 p-3 bg-[rgba(28,28,28,0.04)] rounded-standard border border-[#eceae4] text-[14px] text-[#1c1c1c]">
              <Check className="w-4 h-4 text-[#1c1c1c]" />
              <span>Inscribed! Your first Sunday Dispatch will arrive this weekend.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.reading.lamp@domain.com"
                className="flex-1 bg-[#f7f4ed] border border-[#eceae4] rounded-standard px-3.5 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
              />
              <Button type="submit" variant="primary" size="md" className="gap-2 shrink-0 shadow-button-inset">
                <Send className="w-3.5 h-3.5" />
                <span>Inscribe Me</span>
              </Button>
            </form>
          )}
        </div>

        {/* Multi-Page Navigation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Link
            to="/books"
            className="p-4 rounded-card border border-[#eceae4] hover:border-[rgba(28,28,28,0.4)] bg-[#f7f4ed] transition-all group"
          >
            <div className="text-[11px] font-mono text-[#8c5e43] uppercase tracking-wider">Browse</div>
            <h4 className="font-editorial text-[17px] font-medium text-[#1c1c1c] mt-1 group-hover:underline">
              The Full Catalog →
            </h4>
            <p className="text-[12px] text-[#5f5f5d] mt-1">
              Explore filterable genres, author archives, and thematic shelves.
            </p>
          </Link>

          <Link
            to="/community"
            className="p-4 rounded-card border border-[#eceae4] hover:border-[rgba(28,28,28,0.4)] bg-[#f7f4ed] transition-all group"
          >
            <div className="text-[11px] font-mono text-[#8c5e43] uppercase tracking-wider">Engage</div>
            <h4 className="font-editorial text-[17px] font-medium text-[#1c1c1c] mt-1 group-hover:underline">
              Community Circles →
            </h4>
            <p className="text-[12px] text-[#5f5f5d] mt-1">
              Join active reading clubs, debates, and shared reading marathons.
            </p>
          </Link>

          <Link
            to="/shelf"
            className="p-4 rounded-card border border-[#eceae4] hover:border-[rgba(28,28,28,0.4)] bg-[#f7f4ed] transition-all group"
          >
            <div className="text-[11px] font-mono text-[#8c5e43] uppercase tracking-wider">Sanctuary</div>
            <h4 className="font-editorial text-[17px] font-medium text-[#1c1c1c] mt-1 group-hover:underline">
              Your Personal Shelf →
            </h4>
            <p className="text-[12px] text-[#5f5f5d] mt-1">
              Manage saved volumes, reading milestones, and personal notes.
            </p>
          </Link>
        </div>

        {/* Colophon Typography & Craft Notice */}
        <div className="pt-6 border-t border-[#eceae4] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[12px] text-[#5f5f5d] gap-2">
          <div>
            BookShelf © 2026. Designed with warm cream (#f7f4ed), charcoal (#1c1c1c), and tactile analog spirit.
          </div>
          <div className="font-mono text-[11px]">
            Set in Plus Jakarta Sans & Newsreader
          </div>
        </div>
      </div>

      {/* Chapter Footer Navigation */}
      <div className="pt-6 border-t border-[#eceae4] flex items-center justify-between mt-8 text-[14px]">
        <button
          onClick={() => {
            soundManager.playPageTurn();
            onPrevPage();
          }}
          className="inline-flex items-center gap-1.5 text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Chapter IV: Margin Notes</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPageTurn();
            onResetToStart();
          }}
          className="inline-flex items-center gap-1.5 font-medium text-[#1c1c1c] hover:underline underline-offset-4 group transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return to Cover & Foreword</span>
        </button>
      </div>
    </div>
  );
};
