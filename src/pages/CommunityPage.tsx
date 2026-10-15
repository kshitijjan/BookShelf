import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  MessageSquare,
  Plus,
  Check,
  Heart,
  ArrowRight,
  Sparkles,
  Loader2,
  Crown,
  Pencil,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { READING_CIRCLES_DATA } from '../data/communityData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { soundManager } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { fetchTopMarginNotes, likeMarginNote } from '../services/marginNotesApi';
import { fetchReadingCircles } from '../services/readingCirclesApi';
import { MarginNote, ReadingCircle } from '../types/book';
import { CreateCircleModal } from '../components/community/CreateCircleModal';
import { EditCircleModal } from '../components/community/EditCircleModal';

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, openAuthModal, toggleJoinCircle } = useAuth();

  // Reading circles state
  const [circles, setCircles] = useState<ReadingCircle[]>(READING_CIRCLES_DATA);
  const [isLoadingCircles, setIsLoadingCircles] = useState(true);
  const [activeCircleTab, setActiveCircleTab] = useState<'all' | 'founded'>('all');

  // Modal State for founding and editing a circle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCircle, setEditingCircle] = useState<ReadingCircle | null>(null);

  // Top 4 notes from database
  const [topNotes, setTopNotes] = useState<MarginNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [likedNoteIds, setLikedNoteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookshelf_liked_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch circles on load
  useEffect(() => {
    let isCancelled = false;
    async function loadCircles() {
      setIsLoadingCircles(true);
      try {
        const data = await fetchReadingCircles();
        if (!isCancelled && data && data.length > 0) {
          setCircles(data);
        }
      } catch (err) {
        console.warn('Failed to load circles:', err);
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

  // Fetch top margin notes on load
  useEffect(() => {
    let isCancelled = false;
    async function loadDailyNotes() {
      setIsLoadingNotes(true);
      try {
        const notes = await fetchTopMarginNotes();
        if (!isCancelled) {
          setTopNotes(notes);
        }
      } catch (err) {
        console.error('Failed to load top notes on community page:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingNotes(false);
        }
      }
    }
    loadDailyNotes();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLike = async (id: string) => {
    soundManager.playBookmarkClick();
    const isCurrentlyLiked = likedNoteIds.includes(id);
    const newLikedIds = isCurrentlyLiked
      ? likedNoteIds.filter((item) => item !== id)
      : [...likedNoteIds, id];

    setLikedNoteIds(newLikedIds);
    try {
      localStorage.setItem('bookshelf_liked_notes', JSON.stringify(newLikedIds));
    } catch {}

    setTopNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, likes: isCurrentlyLiked ? Math.max(0, n.likes - 1) : n.likes + 1 } : n
      )
    );

    try {
      await likeMarginNote(id, user?.email, !isCurrentlyLiked);
    } catch (err) {
      console.warn('Error liking note on community page:', err);
    }
  };

  // Joined circle IDs: strictly derived from authenticated user profile (never hardcoded!)
  const joinedCircleIds = isLoggedIn && user?.joinedCircles ? user.joinedCircles : [];

  const handleToggleJoin = async (id: string) => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    const joinedNow = await toggleJoinCircle(id);
    setCircles((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, membersCount: Math.max(1, c.membersCount + (joinedNow ? 1 : -1)) }
          : c
      )
    );

    if (joinedNow) {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#1c1c1c', '#eceae4', '#8c5e43'],
      });
    }
  };

  const handleOpenCreateModal = () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    setIsModalOpen(true);
  };

  // Filter circles: All vs My Founded Circles
  const myFoundedCircles = circles.filter(
    (c) => c.founderEmail && user?.email && c.founderEmail.toLowerCase() === user.email.toLowerCase()
  );

  const displayedCircles = activeCircleTab === 'all' ? circles : myFoundedCircles;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-[#eceae4] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-[#8c5e43] mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>The Salon & Reading Guilds</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#1c1c1c] tracking-tight-section">
            Literary Community
          </h1>
          <p className="text-[16px] text-[#5f5f5d] mt-1 max-w-2xl">
            Where thoughtful readers gather across continents to dissect prose, debate philosophy, and leave lasting marginalia.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          className="gap-2 shrink-0 shadow-button-inset"
        >
          <Plus className="w-4 h-4" />
          <span>Found a Reading Circle</span>
        </Button>
      </div>

      {/* Reading Circles Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold font-editorial text-[#1c1c1c] tracking-tight-sub">
              Active Salons & Reading Circles
            </h2>
            <span className="text-[13px] text-[#5f5f5d]">Gathering weekly online & offline • Showing top 3 salons</span>
          </div>

          {/* Filter Tabs & View All Salons Link */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCircleTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors border flex items-center gap-1.5 ${
                activeCircleTab === 'all'
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                  : 'bg-[#fcfbf8] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4] hover:text-[#1c1c1c]'
              }`}
            >
              <span>All Salons</span>
              <span className={`text-[11px] font-mono ${activeCircleTab === 'all' ? 'text-white/70' : 'text-[#8c5e43]'}`}>
                ({circles.length})
              </span>
            </button>

            <button
              onClick={() => setActiveCircleTab('founded')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors border flex items-center gap-1.5 ${
                activeCircleTab === 'founded'
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                  : 'bg-[#fcfbf8] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4] hover:text-[#1c1c1c]'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-[#8c5e43]" />
              <span>My Founded</span>
              <span className={`text-[11px] font-mono ${activeCircleTab === 'founded' ? 'text-white/70' : 'text-[#8c5e43]'}`}>
                ({myFoundedCircles.length})
              </span>
            </button>

            <Button
              variant="cream"
              size="sm"
              onClick={() => navigate('/community/salons')}
              className="gap-1.5 text-[12px] font-medium"
            >
              <span>View All Salons</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8c5e43]" />
            </Button>
          </div>
        </div>

        {/* Circles Grid (strictly top 3) or Tab-Specific Empty States */}
        {isLoadingCircles ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#5f5f5d]">
            <Loader2 className="w-6 h-6 animate-spin text-[#8c5e43]" />
            <span className="text-[13px] font-mono">Gathering active salons...</span>
          </div>
        ) : activeCircleTab === 'founded' && !isLoggedIn ? (
          <div className="text-center py-12 bg-[#fcfbf8] border border-dashed border-[#eceae4] rounded-card space-y-3">
            <Users className="w-8 h-8 text-[#8c5e43] mx-auto opacity-70" />
            <h3 className="text-lg font-medium text-[#1c1c1c]">Sign In to View Founded Circles</h3>
            <p className="text-[14px] text-[#5f5f5d] max-w-md mx-auto">
              Sign in to inscribe and oversee your literary salons, guide discussions, and gather reading fellows.
            </p>
            <Button variant="primary" size="sm" onClick={openAuthModal} className="gap-2 shadow-button-inset">
              <span>Sign In to Sanctuary</span>
            </Button>
          </div>
        ) : activeCircleTab === 'founded' && myFoundedCircles.length === 0 ? (
          <div className="text-center py-12 bg-[#fcfbf8] border border-dashed border-[#eceae4] rounded-card space-y-3">
            <Crown className="w-8 h-8 text-[#8c5e43] mx-auto opacity-70" />
            <h3 className="text-lg font-medium text-[#1c1c1c]">No Founded Circles Yet</h3>
            <p className="text-[14px] text-[#5f5f5d] max-w-md mx-auto">
              You haven't founded any reading salons yet. Create a circle around a masterpiece and invite fellow scholars to converse.
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="gap-2 shadow-button-inset">
              <Plus className="w-4 h-4" />
              <span>Found Your First Reading Circle</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedCircles.slice(0, 3).map((circle) => {
                const isJoined = joinedCircleIds.includes(circle.id);
                const isMyCircle =
                  circle.founderEmail &&
                  user?.email &&
                  circle.founderEmail.toLowerCase() === user.email.toLowerCase();

                return (
                  <div
                    key={circle.id}
                    className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-6 flex flex-col justify-between shadow-book-sheet transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {isMyCircle ? (
                          <span className="text-[11px] font-mono text-[#8c5e43] bg-[#f7f4ed] px-2 py-0.5 rounded border border-[#eceae4] flex items-center gap-1 font-semibold">
                            <Crown className="w-3 h-3 text-[#8c5e43]" />
                            <span>Founder: You</span>
                          </span>
                        ) : (
                          <Badge variant="subtle">Weekly Salon</Badge>
                        )}
                        <span className="text-[12px] text-[#5f5f5d] font-mono">
                          {circle.membersCount} Members
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

                    <div className="pt-4 border-t border-[#eceae4] mt-4 flex items-center justify-between">
                      <span className="text-[12px] text-[#5f5f5d] flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Active Salon
                      </span>

                      {isMyCircle ? (
                        <Button
                          variant="cream"
                          size="sm"
                          onClick={() => setEditingCircle(circle)}
                          className="gap-1.5 text-[12px] text-[#8c5e43] hover:text-[#1c1c1c]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit Salon</span>
                        </Button>
                      ) : (
                        <Button
                          variant={isJoined ? 'ghost' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleJoin(circle.id)}
                          className="gap-1.5"
                        >
                          {isJoined ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Joined</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Join Salon</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom link to view all salons */}
            <div className="pt-2 text-center">
              <Link
                to="/community/salons"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#fcfbf8] hover:bg-[#eceae4] border border-[#eceae4] hover:border-[#1c1c1c] text-[13px] font-medium text-[#1c1c1c] transition-all shadow-button-inset group"
              >
                <span>Explore all {circles.length} reading salons & guilds</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8c5e43] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Top 4 Reader Marginalia of the Day & Explore Option */}
      <div className="space-y-5 pt-4 border-t border-[#eceae4]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#8c5e43]" />
              <span className="text-[12px] font-mono uppercase tracking-wider text-[#8c5e43] font-semibold">
                Daily Highlights
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold font-editorial text-[#1c1c1c] tracking-tight-sub">
              Top Reader Marginalia of the Day
            </h2>
            <p className="text-[14px] text-[#5f5f5d] mt-0.5">
              Four top notes chosen from reader copies across the sanctuary today.
            </p>
          </div>

          <Link
            to="/community/explore"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-standard bg-[#fcfbf8] hover:bg-[#eceae4] border border-[#eceae4] hover:border-[#1c1c1c] text-[13px] font-medium text-[#1c1c1c] transition-all shadow-button-inset group shrink-0"
          >
            <span>Explore All Marginalia</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5f5f5d] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isLoadingNotes ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#5f5f5d]">
            <Loader2 className="w-6 h-6 animate-spin text-[#8c5e43]" />
            <span className="text-[13px] font-mono">Fetching today’s top marginalia...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {topNotes.slice(0, 4).map((note) => {
              const isLiked = likedNoteIds.includes(note.id);
              const commentsCount = Array.isArray(note.comments) ? note.comments.length : 0;

              return (
                <div
                  key={note.id}
                  className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-5 space-y-3.5 shadow-book-sheet transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[12px] text-[#5f5f5d]">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            note.readerAvatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={note.readerName}
                          className="w-6 h-6 rounded-full object-cover border border-[#eceae4]"
                        />
                        <span className="font-medium text-[#1c1c1c]">{note.readerName}</span>
                      </div>
                      <span>{note.timestamp || 'Today'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-[#1c1c1c]">{note.bookTitle}</span>
                        {note.bookAuthor && note.bookAuthor !== 'Archived Writer' && (
                          <span className="text-[11px] text-[#5f5f5d] truncate">by {note.bookAuthor}</span>
                        )}
                      </div>
                      {note.pageNumber ? (
                        <span className="font-mono text-[11px] bg-[rgba(28,28,28,0.03)] px-2 py-0.5 rounded border border-[#eceae4] shrink-0">
                          Page {note.pageNumber}
                        </span>
                      ) : null}
                    </div>

                    <p className="italic font-serif-quote text-[14px] text-[#1c1c1c] border-l-2 border-[#8c5e43] pl-3 py-0.5 leading-relaxed bg-[#f7f4ed]/50 rounded-r">
                      {note.passageSnippet.startsWith('“') || note.passageSnippet.startsWith('"')
                        ? note.passageSnippet
                        : `“${note.passageSnippet}”`}
                    </p>

                    <p className="text-[13px] text-[rgba(28,28,28,0.85)] leading-relaxed">
                      {note.noteText}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#eceae4] flex items-center justify-between text-[12px]">
                    <Link
                      to="/community/explore"
                      className="inline-flex items-center gap-1.5 text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{commentsCount} comments</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleLike(note.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                        isLiked
                          ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c]'
                          : 'bg-[#f7f4ed] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4] hover:text-[#1c1c1c]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-[#8c5e43]' : ''}`} />
                      <span>{note.likes}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Circle Modal */}
      <CreateCircleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
