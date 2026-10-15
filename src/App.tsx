import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/HomePage';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileSetupModal } from './components/auth/ProfileSetupModal';

// Route-level code splitting
const BooksPage = lazy(() => import('./pages/BooksPage').then(m => ({ default: m.BooksPage })));
const ShelfPage = lazy(() => import('./pages/ShelfPage').then(m => ({ default: m.ShelfPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const CommunityExplorePage = lazy(() => import('./pages/CommunityExplorePage').then(m => ({ default: m.CommunityExplorePage })));
const SalonsPage = lazy(() => import('./pages/SalonsPage').then(m => ({ default: m.SalonsPage })));

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#8c5e43] border-t-transparent animate-spin" />
      <span className="font-mono text-[12px] text-[#5f5f5d] tracking-wider uppercase">Turning folio...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookshelf_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem('bookshelf_bookmarks', JSON.stringify(bookmarkedIds));
    } catch {
      // Ignore write errors in restricted environments
    }
  }, [bookmarkedIds]);

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectChapter = (index: number) => {
    setCurrentPageIndex(index);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(`chapter-${index + 1}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(`chapter-${index + 1}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#1c1c1c] flex flex-col font-sans selection:bg-[#1c1c1c] selection:text-[#fcfbf8]">
      {/* Sticky Lovable Parchment Navbar */}
      <Navbar
        currentChapterIndex={currentPageIndex}
        onSelectChapter={handleSelectChapter}
        savedBooksCount={bookmarkedIds.length}
      />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  currentPageIndex={currentPageIndex}
                  onPageChange={setCurrentPageIndex}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
              }
            />
            <Route
              path="/books"
              element={
                <BooksPage
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
              }
            />
            <Route
              path="/shelf"
              element={
                <ShelfPage
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
              }
            />
            <Route
              path="/community"
              element={<CommunityPage />}
            />
            <Route
              path="/community/salons"
              element={<SalonsPage />}
            />
            <Route
              path="/community/circles"
              element={<Navigate to="/community/salons" replace />}
            />
            <Route
              path="/community/explore"
              element={<CommunityExplorePage />}
            />
            <Route
              path="/explore"
              element={<CommunityExplorePage />}
            />

            <Route
              path="/profile"
              element={<Navigate to="/shelf" replace />}
            />
            <Route
              path="*"
              element={
                <HomePage
                  currentPageIndex={currentPageIndex}
                  onPageChange={setCurrentPageIndex}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* Global Authentication & Onboarding Modals */}
      <AuthModal />
      <ProfileSetupModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
