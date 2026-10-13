import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityExplorePage } from './pages/CommunityExplorePage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileSetupModal } from './components/auth/ProfileSetupModal';

const AppContent: React.FC = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookshelf_bookmarks');
      return saved ? JSON.parse(saved) : ['book-1', 'book-2'];
    } catch {
      return ['book-1', 'book-2'];
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
            path="/community"
            element={<CommunityPage />}
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
            element={
              <ProfilePage
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
              />
            }
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
