import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, MessageSquare, Plus, Check, Heart, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { READING_CIRCLES_DATA } from '../data/communityData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { soundManager } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { fetchTopMarginNotes, likeMarginNote } from '../services/marginNotesApi';
import { MarginNote } from '../types/book';
import confetti from 'canvas-confetti';

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [joinedCircleIds, setJoinedCircleIds] = useState<string[]>(['circle-1']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleBook, setCircleBook] = useState('');

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

  const toggleJoin = (id: string) => {
    if (joinedCircleIds.includes(id)) {
      setJoinedCircleIds(joinedCircleIds.filter((item) => item !== id));
    } else {
      setJoinedCircleIds([...joinedCircleIds, id]);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#1c1c1c', '#eceae4', '#8c5e43'],
      });
    }
  };

  const handleCreateCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleName.trim()) return;
    setIsModalOpen(false);
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1c1c1c', '#eceae4', '#8c5e43'],
    });
  };

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
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shrink-0 shadow-button-inset"
        >
          <Plus className="w-4 h-4" />
          <span>Found a Reading Circle</span>
        </Button>
      </div>

      {/* Reading Circles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-editorial text-[#1c1c1c] tracking-tight-sub">
            Active Salons & Reading Circles
          </h2>
          <span className="text-[13px] text-[#5f5f5d]">Gathering weekly online & offline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {READING_CIRCLES_DATA.map((circle) => {
            const isJoined = joinedCircleIds.includes(circle.id);
            return (
              <div
                key={circle.id}
                className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-6 flex flex-col justify-between shadow-book-sheet transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="subtle">Weekly Salon</Badge>
                    <span className="text-[12px] text-[#5f5f5d] font-mono">
                      {circle.membersCount} Members
                    </span>
                  </div>

                  <div>
                    <h3 className="font-editorial text-xl font-medium text-[#1c1c1c]">
                      {circle.name}
                    </h3>
                    <p className="text-[13px] text-[#5f5f5d] mt-1">
                      Currently Reading: <span className="text-[#1c1c1c] font-medium">{circle.currentBook}</span> by {circle.author}
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
                  <Button
                    variant={isJoined ? 'ghost' : 'primary'}
                    size="sm"
                    onClick={() => toggleJoin(circle.id)}
                    className="gap-1.5"
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Joined
                      </>
                    ) : (
                      'Join Salon'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#f7f4ed] border border-[#eceae4] rounded-container p-6 parchment-texture shadow-xl">
            <h3 className="text-xl font-medium text-[#1c1c1c] font-editorial mb-1">
              Found a Reading Circle
            </h3>
            <p className="text-[13px] text-[#5f5f5d] mb-4">
              Gather fellow minds around a book that demands shared contemplation.
            </p>
            <form onSubmit={handleCreateCircle} className="space-y-3">
              <div>
                <label className="block text-[12px] text-[#5f5f5d] mb-1">Circle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto Tea & Prose Society"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard px-3 py-2 text-[14px] text-[#1c1c1c] focus-warm"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#5f5f5d] mb-1">Inaugural Book</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Book of Disquiet"
                  value={circleBook}
                  onChange={(e) => setCircleBook(e.target.value)}
                  className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard px-3 py-2 text-[14px] text-[#1c1c1c] focus-warm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="cream" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Inscribe Circle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
