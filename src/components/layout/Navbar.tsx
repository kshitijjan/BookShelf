import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Volume2, VolumeX, Menu, X, Library, Sparkles } from 'lucide-react';
import { RibbonBookmark } from './RibbonBookmark';
import { Button } from '../ui/Button';
import { soundManager } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentChapterIndex?: number;
  onSelectChapter?: (index: number) => void;
  savedBooksCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentChapterIndex = 0,
  onSelectChapter = () => {},
  savedBooksCount = 0,
}) => {
  const location = useLocation();
  const { isLoggedIn, isSignedIn, openAuthModal, openProfileSetup } = useAuth();
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMuted(soundManager.getMuted());
  }, []);

  const toggleSound = () => {
    const updated = soundManager.toggleMute();
    setIsMuted(updated);
    if (!updated) {
      soundManager.playBookmarkClick();
    }
  };

  // Nav links: removed 'Profile' as per requirement 1
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Books', path: '/books' },
    { label: 'Community', path: '/community' },
  ];

  const isHome = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#f7f4ed]/90 backdrop-blur-md border-b border-[#eceae4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Wordmark Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#1c1c1c] group focus-warm rounded-standard"
        >
          <div className="w-8 h-8 rounded-standard bg-[#1c1c1c] text-[#fcfbf8] flex items-center justify-center shadow-button-inset group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-editorial text-[20px] font-semibold tracking-tight-sub text-[#1c1c1c]">
            BookShelf
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-[#5f5f5d] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#eceae4] bg-[rgba(28,28,28,0.03)]">
            Volume 1
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[15px] font-normal transition-colors relative py-1 ${
                  isActive
                    ? 'text-[#1c1c1c] font-medium'
                    : 'text-[rgba(28,28,28,0.7)] hover:text-[#1c1c1c]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1c1c1c] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Tools: Ribbon, Sound Toggle, Shelf Button */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-full text-[#1c1c1c] hover:bg-[rgba(28,28,28,0.05)] border border-[#eceae4] transition-colors focus-warm"
            title={isMuted ? 'Unmute paper page audio' : 'Mute paper page audio'}
            aria-label="Toggle Sound"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#5f5f5d]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#1c1c1c]" />
            )}
          </button>

          {/* Ribbon Bookmark Menu */}
          <RibbonBookmark
            currentChapterIndex={currentChapterIndex}
            onSelectChapter={onSelectChapter}
            isHomePage={isHome}
          />

          {/* Shelf CTA: 'Build Shelf' when not logged in / not onboarded, 'My Shelf' when logged in */}
          {isLoggedIn ? (
            <div className="hidden sm:flex items-center">
              <Link to="/profile">
                <Button variant="primary" size="sm" className="gap-2 shadow-button-inset">
                  <Library className="w-4 h-4" />
                  <span>My Shelf</span>
                  {savedBooksCount > 0 && (
                    <span className="ml-0.5 bg-[#fcfbf8] text-[#1c1c1c] text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                      {savedBooksCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          ) : isSignedIn ? (
            <div className="hidden sm:flex items-center">
              <Button
                variant="primary"
                size="sm"
                onClick={openProfileSetup}
                className="gap-2 shadow-button-inset"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build Shelf</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openAuthModal}
              className="hidden sm:inline-flex gap-2 shadow-button-inset"
            >
              <Sparkles className="w-4 h-4" />
              <span>Build Shelf</span>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-[6px] text-[#1c1c1c] hover:bg-[rgba(28,28,28,0.05)] border border-[#eceae4]"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-[#eceae4] bg-[#f7f4ed] px-4 py-4 space-y-3 parchment-texture animate-fade-in">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-standard text-[15px] ${
                  location.pathname === link.path
                    ? 'bg-[#eceae4] text-[#1c1c1c] font-medium'
                    : 'text-[rgba(28,28,28,0.8)] hover:bg-[rgba(28,28,28,0.04)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-[#eceae4]">
            {isLoggedIn ? (
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block"
              >
                <Button variant="primary" className="w-full justify-center gap-2">
                  <Library className="w-4 h-4" />
                  <span>My Shelf ({savedBooksCount})</span>
                </Button>
              </Link>
            ) : isSignedIn ? (
              <Button
                variant="primary"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openProfileSetup();
                }}
                className="w-full justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build Shelf</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="w-full justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build Shelf</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
