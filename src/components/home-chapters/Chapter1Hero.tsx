import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, BookMarked, Search, ArrowUpRight, Quote, Library, MessageSquare, Feather } from 'lucide-react';
import { Button } from '../ui/Button';
import { soundManager } from '../../utils/sound';

interface Chapter1HeroProps {
  onNextPage: () => void;
  onSearchPrompt: (query: string) => void;
}

export const Chapter1Hero: React.FC<Chapter1HeroProps> = ({
  onNextPage,
  onSearchPrompt,
}) => {
  const [promptInput, setPromptInput] = useState('');

  const suggestionPills = [
    'Poetic sci-fi like Ted Chiang',
    'Rainy day in a Jimbocho bookstore',
    'Philosophical mystery in Barcelona',
    'Quiet melancholy to heal a restless soul',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptInput.trim()) {
      onSearchPrompt(promptInput.trim());
      soundManager.playPageTurn();
      onNextPage();
    }
  };

  const handlePillClick = (pill: string) => {
    setPromptInput(pill);
    onSearchPrompt(pill);
    soundManager.playPageTurn();
    onNextPage();
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-start py-6 sm:py-8 px-4 sm:px-8 max-w-5xl mx-auto parchment-texture book-spine-left book-edge-sheets rounded-container border border-[#eceae4]">
      {/* Editorial Chapter Header Stamp */}
      <div className="flex items-center justify-between border-b border-[#eceae4] pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="font-serif-quote text-[13px] text-[#8c5e43] font-bold tracking-widest uppercase">
            Chapter I
          </span>
          <span className="text-[#eceae4]">•</span>
          <span className="text-[12px] uppercase tracking-wider text-[#5f5f5d] font-mono">
            The Foreword
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#5f5f5d] font-mono">
          <span>Sanctuary Edition</span>
          <span className="text-[#eceae4]">•</span>
          <span>Folio 01</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-5 max-w-3xl mt-1">
        {/* Atmospheric Warm Multi-color Wash */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-[#fae8d2]/40 via-[#f5d0b5]/20 to-[#e0ebf5]/30 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Embedded Literary Epigraph / Quote of the Day on the Page Surface */}
        <div className="border-l-2 border-[#8c5e43] pl-4 sm:pl-5 py-1">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-3.5 h-3.5 text-[#8c5e43]" />
            <span className="font-mono uppercase tracking-widest text-[#8c5e43] font-semibold text-[11px]">
              Quote of the Day
            </span>
            <span className="text-[#eceae4]">•</span>
            <span className="text-[#5f5f5d] font-mono text-[11px]">
              Folio Epigraph
            </span>
          </div>

          <blockquote className="font-serif-quote italic text-2xl sm:text-3xl text-[#1c1c1c] leading-relaxed">
            “Every book has a soul. The soul of the person who wrote it and of those who read it and lived and dreamed with it.”
          </blockquote>

          {/* Book reference link on the right side */}
          <div className="flex justify-end mt-2.5">
            <Link
              to="/books?book=book-4"
              className="inline-flex items-center gap-1.5 text-[14px] text-[#5f5f5d] hover:text-[#1c1c1c] group/link transition-colors"
              title="Inspect volume in Literary Vault"
            >
              <span className="text-[13px] text-[#5f5f5d]">From</span>
              <span className="font-medium text-[#1c1c1c] underline decoration-1 underline-offset-4 group-hover/link:text-[#8c5e43]">
                The Shadow of the Wind
              </span>
              <span className="text-[13px] text-[#5f5f5d]">by Carlos Ruiz Zafón</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8c5e43] transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* Subtle Page Divider */}
        <div className="h-[1px] bg-[#eceae4] w-full my-4" />

        {/* Intro Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(28,28,28,0.03)] border border-[#eceae4] text-[13px] text-[#1c1c1c]">
          <BookMarked className="w-3.5 h-3.5 text-[#8c5e43]" />
          <span>An analog sanctuary for the discerning reader</span>
        </div>

        {/* Headline - Matching font size (text-2xl sm:text-3xl) */}
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1c1c1c] leading-snug tracking-tight-sub">
          Books that find you before you know you need them.
        </h1>

        {/* AI Prompt Input Bar */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="relative bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] focus-within:border-[rgba(28,28,28,0.4)] rounded-card p-2 shadow-book-sheet transition-all"
          >
            <div className="flex items-center gap-2 px-2">
              <Search className="w-5 h-5 text-[#5f5f5d] shrink-0" />
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Describe a feeling, a dilemma, or a favorite passage..."
                className="w-full bg-transparent text-[#1c1c1c] placeholder-[#5f5f5d] text-[15px] sm:text-[16px] py-2 focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="shrink-0 gap-1.5 shadow-button-inset"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Consult Archivist</span>
                <span className="sm:hidden">Find</span>
              </Button>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="mt-3 pt-2.5 border-t border-[#eceae4]/80 flex flex-wrap items-center gap-1.5 px-1">
              <span className="text-[11px] uppercase tracking-wider text-[#5f5f5d] font-mono mr-1">
                Invocations:
              </span>
              {suggestionPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handlePillClick(pill)}
                  className="text-[12px] text-[rgba(28,28,28,0.82)] bg-[#f7f4ed] hover:bg-[#eceae4] border border-[#eceae4] px-2.5 py-1 rounded-full transition-colors active:opacity-80"
                >
                  {pill}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* The Library Wings / Quick Navigation */}
      <div className="w-full max-w-3xl mt-8 sm:mt-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-[1px] flex-1 bg-[#eceae4]"></div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#5f5f5d]">
            Explore The Sanctuary
          </span>
          <div className="h-[1px] flex-1 bg-[#eceae4]"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/books" className="group flex items-start gap-3 p-3 rounded-card border border-transparent hover:border-[#eceae4] hover:bg-[rgba(28,28,28,0.02)] transition-all">
            <div className="mt-0.5 p-1.5 rounded-full bg-[#fcfbf8] border border-[#eceae4] group-hover:border-[rgba(28,28,28,0.2)] shadow-sm">
              <Library className="w-3.5 h-3.5 text-[#8c5e43]" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#1c1c1c] group-hover:text-[#8c5e43] transition-colors">The Vault</div>
              <div className="text-[12px] text-[#5f5f5d] mt-0.5 leading-snug">Browse curated volumes</div>
            </div>
          </Link>

          <Link to="/community" className="group flex items-start gap-3 p-3 rounded-card border border-transparent hover:border-[#eceae4] hover:bg-[rgba(28,28,28,0.02)] transition-all">
            <div className="mt-0.5 p-1.5 rounded-full bg-[#fcfbf8] border border-[#eceae4] group-hover:border-[rgba(28,28,28,0.2)] shadow-sm">
              <MessageSquare className="w-3.5 h-3.5 text-[#8c5e43]" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#1c1c1c] group-hover:text-[#8c5e43] transition-colors">Community</div>
              <div className="text-[12px] text-[#5f5f5d] mt-0.5 leading-snug">Join the reading rooms</div>
            </div>
          </Link>

          <Link to="/profile" className="group flex items-start gap-3 p-3 rounded-card border border-transparent hover:border-[#eceae4] hover:bg-[rgba(28,28,28,0.02)] transition-all">
            <div className="mt-0.5 p-1.5 rounded-full bg-[#fcfbf8] border border-[#eceae4] group-hover:border-[rgba(28,28,28,0.2)] shadow-sm">
              <Feather className="w-3.5 h-3.5 text-[#8c5e43]" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#1c1c1c] group-hover:text-[#8c5e43] transition-colors">Your Desk</div>
              <div className="text-[12px] text-[#5f5f5d] mt-0.5 leading-snug">View saved margins</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Chapter Footer pushed to bottom with mt-auto */}
      <div className="mt-auto pt-6 border-t border-[#eceae4] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[13px] text-[#5f5f5d]">
          <span className="italic font-serif-quote">
            "A reader lives a thousand lives before he dies."
          </span>
          <span className="hidden sm:inline text-[#eceae4]">•</span>
          <span className="hidden sm:inline text-[11px] font-mono">George R.R. Martin</span>
        </div>

        <button
          onClick={() => {
            soundManager.playPageTurn();
            onNextPage();
          }}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-[#1c1c1c] hover:underline underline-offset-4 transition-all group"
        >
          <span>Turn to Chapter II: Curator’s Shelf</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
