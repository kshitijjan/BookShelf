import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Award,
  Trash2,
  ArrowUpRight,
  Sparkles,
  LogOut,
  Edit3,
  Plus,
  Calendar,
  CheckCircle2,
  Check,
  Pencil,
  Mail,
  Crown,
  Users,
  Loader2,
} from 'lucide-react';
import { BookCover } from '../components/ui/BookCover';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookDetailModal } from '../components/books/BookDetailModal';
import { AddBookModal } from '../components/profile/AddBookModal';
import { CreateCircleModal } from '../components/community/CreateCircleModal';
import { EditCircleModal } from '../components/community/EditCircleModal';
import { Book, ReadingCircle } from '../types/book';
import { fetchReadingCircles } from '../services/readingCirclesApi';
import { useAuth } from '../context/AuthContext';

interface ShelfPageProps {
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
}

export const ShelfPage: React.FC<ShelfPageProps> = ({
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const {
    user,
    isLoggedIn,
    isSignedIn,
    openAuthModal,
    openProfileSetup,
    logout,
    removeBookFromShelf,
    addBookToShelf,
  } = useAuth();

  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeShelfTab, setActiveShelfTab] = useState<'read' | 'reading_list'>('read');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [editingCircle, setEditingCircle] = useState<ReadingCircle | null>(null);
  const [circles, setCircles] = useState<ReadingCircle[]>([]);
  const [isLoadingCircles, setIsLoadingCircles] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    async function loadCircles() {
      setIsLoadingCircles(true);
      try {
        const data = await fetchReadingCircles();
        if (!isCancelled && Array.isArray(data)) {
          setCircles(data);
        }
      } catch (err) {
        console.warn('[ShelfPage] Failed to load circles:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingCircles(false);
        }
      }
    }
    loadCircles();
    return () => {
      isCancelled = true;
    };
  }, []);

  const availableYears = [2026, 2025, 2024, 2027, 2028];

  // If user is not logged in, display the Build Shelf sanctuary welcome screen
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-[#fcfbf8] border border-[#eceae4] rounded-container p-8 sm:p-12 shadow-book-sheet parchment-texture text-center book-spine-left">
          <div className="w-16 h-16 rounded-standard bg-[#1c1c1c] text-[#fcfbf8] flex items-center justify-center mx-auto mb-4 shadow-button-inset">
            <BookOpen className="w-8 h-8" />
          </div>

          <span className="text-[12px] font-mono uppercase tracking-widest text-[#8c5e43] font-semibold">
            The Personal Sanctuary
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c1c] mt-2">
            Build Your Reader Shelf
          </h1>
          <p className="text-[15px] text-[#5f5f5d] mt-2 max-w-lg mx-auto leading-relaxed">
            Sign in to unlock your personal literary sanctuary, calibrate your unique taste profile, track your reading challenge, and curate your personal shelf.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={isSignedIn ? openProfileSetup : openAuthModal}
              className="w-full sm:w-auto gap-2 shadow-button-inset"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSignedIn ? 'Complete Shelf Setup' : 'Sign In & Build Shelf'}</span>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-[#eceae4] flex items-center justify-center gap-6 text-[12px] text-[#5f5f5d] font-mono">
            <span>• Google or Email</span>
            <span>• Instant Taste Profile</span>
            <span>• Annual Literary Goals</span>
          </div>
        </div>
      </div>
    );
  }

  // Shelf calculations based on user's shelfBooks
  const shelfBooks = Array.isArray(user.shelfBooks) ? user.shelfBooks : [];

  // Books marked as 'read' in the specifically selected year
  const readBooksForYear = shelfBooks.filter(
    (item) => item.status === 'read' && item.yearRead === selectedYear
  );

  // Books in the reading list / want to read
  const readingListBooks = shelfBooks.filter(
    (item) => item.status === 'reading_list'
  );

  // Filter user's founded reading circles
  const myFoundedCircles = circles.filter(
    (c) => c.founderEmail && user?.email && c.founderEmail.toLowerCase() === user.email.toLowerCase()
  );

  // Calculate challenge stats strictly for the selected year
  const challengeGoal = user.challengeGoal || 12;
  const booksReadCount = readBooksForYear.length;
  const challengePercent = booksReadCount === 0
    ? 0
    : Math.min(Math.round((booksReadCount / challengeGoal) * 100), 100);

  // Calculate pages read strictly for the books read in this year
  const pagesReadInYear = readBooksForYear.reduce(
    (sum, item) => sum + (Number(item.book?.pages) || 0),
    0
  );

  const initials = `${user.firstName ? user.firstName[0] : 'R'}${user.lastName ? user.lastName[0] : ''}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Sanctuary Reader';
  const personalityText = user.personalities && user.personalities.length > 0
    ? user.personalities.join(' & ')
    : 'Archivist & Reader';

  const displayedBooks = activeShelfTab === 'read' ? readBooksForYear : readingListBooks;

  const handleMarkAsReadFromShelf = (book: Book) => {
    addBookToShelf(book, 'read', selectedYear);
  };

  const handleRemoveFromShelf = (bookId: string) => {
    removeBookFromShelf(bookId);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
      {/* Reader Profile Header */}
      <div className="bg-[#fcfbf8] border border-[#eceae4] rounded-container p-6 sm:p-8 shadow-book-sheet parchment-texture book-spine-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1c1c1c] text-[#fcfbf8] flex items-center justify-center font-editorial text-2xl font-semibold shadow-button-inset">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#8c5e43] text-white p-1 rounded-full border-2 border-[#f7f4ed]">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1c1c1c]">
                  {fullName}
                </h1>
                <Badge variant="subtle">{user.scholarlyRank}</Badge>
                {user.email && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#5f5f5d] bg-[#f7f4ed] px-2.5 py-0.5 rounded border border-[#eceae4]">
                    <Mail className="w-3.5 h-3.5 text-[#8c5e43]" />
                    <span>{user.email}</span>
                  </span>
                )}
              </div>
              <p className="text-[14px] text-[#5f5f5d] mt-1 leading-relaxed">
                {personalityText} • Member since {user.memberSince} • Taste Profile:{' '}
                <span className="text-[#1c1c1c] font-medium font-serif-quote">
                  {user.tasteProfile}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={openProfileSetup}
              className="gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
            <Button
              variant="cream"
              size="sm"
              onClick={logout}
              className="gap-1 text-[#8c5e43] hover:text-[#1c1c1c]"
              title="Sign out of sanctuary"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Reading Goal Progress Bar - Dynamic to Selected Year */}
        <div className="mt-8 pt-6 border-t border-[#eceae4] grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-[14px]">
              <span className="font-medium text-[#1c1c1c] flex items-center gap-2">
                <span>{selectedYear} Literary Challenge</span>
                <span className="text-[12px] font-mono text-[#8c5e43] bg-[#f7f4ed] px-2 py-0.5 rounded border border-[#eceae4]">
                  Year {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={openProfileSetup}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8c5e43] hover:text-[#1c1c1c] bg-[#f7f4ed] px-2 py-0.5 rounded border border-[#eceae4] transition-colors"
                  title="Change your annual reading goal"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Change Goal</span>
                </button>
              </span>
              <span className="text-[#8c5e43] font-mono font-medium">
                {booksReadCount} of {challengeGoal} Books ({challengePercent}%)
              </span>
            </div>

            {/* Progress bar container: 0% means strictly 0% filled */}
            <div className="w-full h-2.5 bg-[#eceae4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1c1c1c] transition-all duration-500 rounded-full"
                style={{ width: `${challengePercent}%` }}
              />
            </div>

            <p className="text-[12px] text-[#5f5f5d]">
              {booksReadCount === 0
                ? `No books logged for ${selectedYear} yet. Add volumes below to begin filling your challenge.`
                : `${booksReadCount} of ${challengeGoal} volumes completed in ${selectedYear}. Keep savoring every passage.`}
            </p>
          </div>

          {/* Quick Metrics: Dynamically computed pages read, bookshelf, and salons metrics */}
          <div className="flex items-center justify-around bg-[#f7f4ed] p-3 rounded-standard border border-[#eceae4]">
            <div className="text-center">
              <div className="font-editorial text-xl font-bold text-[#1c1c1c]">
                {pagesReadInYear}
              </div>
              <div className="text-[11px] text-[#5f5f5d]">Pages Read</div>
            </div>
            <div className="h-8 w-[1px] bg-[#eceae4]" />
            <div className="text-center">
              <div className="font-editorial text-xl font-bold text-[#1c1c1c]">
                {booksReadCount}
              </div>
              <div className="text-[11px] text-[#5f5f5d]">Books Read</div>
            </div>
            <div className="h-8 w-[1px] bg-[#eceae4]" />
            <div className="text-center">
              <div className="font-editorial text-xl font-bold text-[#1c1c1c]">
                {readingListBooks.length}
              </div>
              <div className="text-[11px] text-[#5f5f5d]">Reading List</div>
            </div>
            <div className="h-8 w-[1px] bg-[#eceae4]" />
            <div className="text-center">
              <div className="font-editorial text-xl font-bold text-[#8c5e43]">
                {myFoundedCircles.length}
              </div>
              <div className="text-[11px] text-[#5f5f5d]">Salons Founded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Founded Reading Circles Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eceae4] pb-4">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-[#8c5e43]" />
            <h2 className="font-editorial text-2xl font-semibold text-[#1c1c1c] tracking-tight-sub">
              My Founded Reading Circles
            </h2>
            <span className="text-[11px] font-mono text-[#8c5e43] bg-[#f7f4ed] px-2.5 py-0.5 rounded-full border border-[#eceae4] font-semibold">
              {myFoundedCircles.length} {myFoundedCircles.length === 1 ? 'Salon' : 'Salons'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="cream"
              size="sm"
              onClick={() => navigate('/community/salons')}
              className="gap-1.5 text-[13px]"
            >
              <Users className="w-3.5 h-3.5 text-[#8c5e43]" />
              <span>All Salons Directory</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateCircleOpen(true)}
              className="gap-1.5 shadow-button-inset"
            >
              <Plus className="w-4 h-4" />
              <span>Found a Reading Circle</span>
            </Button>
          </div>
        </div>

        {/* Content: Loading / Grid of Circles / Empty State */}
        {isLoadingCircles ? (
          <div className="py-10 flex items-center justify-center gap-2 text-[#5f5f5d]">
            <Loader2 className="w-5 h-5 animate-spin text-[#8c5e43]" />
            <span className="text-[13px] font-mono">Retrieving your reading salons...</span>
          </div>
        ) : myFoundedCircles.length === 0 ? (
          <div className="text-center py-12 bg-[#fcfbf8] border border-dashed border-[#eceae4] rounded-card space-y-3">
            <Crown className="w-8 h-8 text-[#8c5e43] mx-auto opacity-70" />
            <h3 className="text-lg font-medium text-[#1c1c1c]">No Founded Circles Yet</h3>
            <p className="text-[14px] text-[#5f5f5d] max-w-md mx-auto">
              You haven't founded any reading salons yet. Inaugurate a circle around a masterpiece and convene fellow readers.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateCircleOpen(true)}
                className="gap-2 shadow-button-inset"
              >
                <Plus className="w-4 h-4" />
                <span>Found Your First Reading Circle</span>
              </Button>
              <Button
                variant="cream"
                size="sm"
                onClick={() => navigate('/community/salons')}
                className="gap-1.5 text-[13px]"
              >
                <span>View All Salons</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myFoundedCircles.map((circle) => (
              <div
                key={circle.id}
                className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-6 flex flex-col justify-between shadow-book-sheet transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#8c5e43] bg-[#f7f4ed] px-2 py-0.5 rounded border border-[#eceae4] flex items-center gap-1 font-semibold">
                      <Crown className="w-3 h-3 text-[#8c5e43]" />
                      <span>Founder: You</span>
                    </span>
                    <span className="text-[12px] text-[#5f5f5d] font-mono">
                      {circle.membersCount} {circle.membersCount === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-editorial text-xl font-medium text-[#1c1c1c]">
                      {circle.name}
                    </h3>
                    <p className="text-[13px] text-[#5f5f5d] mt-1">
                      Currently Reading:{' '}
                      <span className="text-[#1c1c1c] font-medium">{circle.currentBook}</span>{' '}
                      {circle.author && `by ${circle.author}`}
                    </p>
                  </div>

                  <div className="bg-[#f7f4ed] p-3 rounded-standard border border-[#eceae4] text-[13px] space-y-1">
                    <div className="flex items-center gap-2 text-[#8c5e43] font-medium text-[12px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{circle.meetingDate}</span>
                    </div>
                    <p className="text-[#5f5f5d] text-[12px] line-clamp-2">
                      Topic: {circle.topic}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#eceae4] mt-4 flex items-center justify-between gap-2">
                  <Button
                    variant="cream"
                    size="sm"
                    onClick={() => setEditingCircle(circle)}
                    className="gap-1.5 text-[12px] text-[#8c5e43] hover:text-[#1c1c1c]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Salon</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/community/salons')}
                    className="gap-1 text-[12px]"
                  >
                    <span>View in Salons</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Bookshelf Section */}
      <div className="space-y-6">
        {/* Bookshelf Header with Year Selector, Books Read, Reading List & Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eceae4] pb-4">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-[#8c5e43]" />
            <h2 className="font-editorial text-2xl font-semibold text-[#1c1c1c] tracking-tight-sub">
              My Personal Shelf
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-[#fcfbf8] border border-[#eceae4] px-3 py-1.5 rounded-full shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-[#8c5e43]" />
              <span className="text-[12px] font-mono text-[#5f5f5d]">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-mono text-[13px] text-[#1c1c1c] font-medium outline-none cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y} {y === 2026 ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Books Read Tab */}
            <button
              onClick={() => setActiveShelfTab('read')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] transition-colors border flex items-center gap-1.5 ${
                activeShelfTab === 'read'
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                  : 'bg-[#fcfbf8] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Books Read</span>
              <span className={`text-[11px] font-mono ${activeShelfTab === 'read' ? 'text-white/70' : 'text-[#8c5e43]'}`}>
                ({readBooksForYear.length})
              </span>
            </button>

            {/* Reading List Tab */}
            <button
              onClick={() => setActiveShelfTab('reading_list')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] transition-colors border flex items-center gap-1.5 ${
                activeShelfTab === 'reading_list'
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                  : 'bg-[#fcfbf8] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Reading List</span>
              <span className={`text-[11px] font-mono ${activeShelfTab === 'reading_list' ? 'text-white/70' : 'text-[#8c5e43]'}`}>
                ({readingListBooks.length})
              </span>
            </button>

            {/* Add Book Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 shadow-button-inset ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </Button>
          </div>
        </div>

        {/* Shelf Books Grid or Empty State */}
        {displayedBooks.length === 0 ? (
          <div className="text-center py-16 bg-[#fcfbf8] border border-dashed border-[#eceae4] rounded-card space-y-3">
            <BookOpen className="w-9 h-9 text-[#8c5e43] mx-auto opacity-60" />
            <h3 className="text-lg font-medium text-[#1c1c1c]">
              {activeShelfTab === 'read'
                ? `No volumes logged for ${selectedYear} yet`
                : 'Your reading list is empty'}
            </h3>
            <p className="text-[14px] text-[#5f5f5d] max-w-sm mx-auto">
              {activeShelfTab === 'read'
                ? `Click "Add Book" above to log books you completed in ${selectedYear}, or inspect any book in the Vault to mark it as read.`
                : 'Add books you want to read from the Vault or search Open Library to build your reading queue.'}
            </p>
            <Button
              variant="cream"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 text-[13px] mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a Volume Now</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedBooks.map((item) => {
              const book = item.book;
              return (
                <div
                  key={book.id}
                  className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-4 transition-all flex flex-col justify-between shadow-book-sheet"
                >
                  <div className="flex gap-4 items-start">
                    <BookCover book={book} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <Badge variant="subtle">{book.genre}</Badge>
                        {item.status === 'read' ? (
                          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Read {item.yearRead}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#8c5e43] bg-[#f7f4ed] px-2 py-0.5 rounded border border-[#eceae4]">
                            Reading List
                          </span>
                        )}
                      </div>
                      <h3 className="font-editorial text-[16px] font-medium text-[#1c1c1c] leading-snug line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-[13px] text-[#5f5f5d] mt-0.5">{book.author}</p>
                      <p className="text-[12px] text-[#5f5f5d] mt-2 font-mono">{book.pages} pages</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#eceae4] mt-4 flex items-center justify-between text-[12px]">
                    {item.status === 'reading_list' ? (
                      <button
                        onClick={() => handleMarkAsReadFromShelf(book)}
                        className="flex items-center gap-1 text-emerald-700 hover:underline font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Read in {selectedYear}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemoveFromShelf(book.id)}
                        className="flex items-center gap-1 text-[#8c5e43] hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}

                    <div className="flex items-center gap-3">
                      {item.status === 'reading_list' && (
                        <button
                          onClick={() => handleRemoveFromShelf(book.id)}
                          className="text-[#5f5f5d] hover:text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBook(book)}
                        className="inline-flex items-center gap-1 font-medium text-[#1c1c1c] hover:underline"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Inspection Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          isBookmarked={bookmarkedIds.includes(selectedBook.id)}
          onToggleBookmark={onToggleBookmark}
        />
      )}

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultYear={selectedYear}
      />

      {/* Create Circle Modal */}
      <CreateCircleModal
        isOpen={isCreateCircleOpen}
        onClose={() => setIsCreateCircleOpen(false)}
        onSuccess={(newCircle) => setCircles((prev) => [newCircle, ...prev])}
      />

      {/* Edit Circle Modal (Founder Only) */}
      <EditCircleModal
        isOpen={!!editingCircle}
        circle={editingCircle}
        onClose={() => setEditingCircle(null)}
        onSuccess={(updated) => {
          setCircles((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }}
      />
    </div>
  );
};
