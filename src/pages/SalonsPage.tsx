import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  MessageSquare,
  Plus,
  Check,
  Crown,
  Loader2,
  ArrowLeft,
  Pencil,
  Search,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { fetchReadingCircles } from '../services/readingCirclesApi';
import { ReadingCircle } from '../types/book';
import { CreateCircleModal } from '../components/community/CreateCircleModal';
import { EditCircleModal } from '../components/community/EditCircleModal';
import { READING_CIRCLES_DATA } from '../data/communityData';

export const SalonsPage: React.FC = () => {
  const { user, isLoggedIn, openAuthModal, toggleJoinCircle } = useAuth();

  const [circles, setCircles] = useState<ReadingCircle[]>(READING_CIRCLES_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'founded'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCircle, setEditingCircle] = useState<ReadingCircle | null>(null);

  const joinedCircleIds = Array.isArray(user?.joinedCircles) ? user.joinedCircles : [];

  const loadCircles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReadingCircles();
      if (Array.isArray(data) && data.length > 0) {
        setCircles(data);
      }
    } catch (err) {
      console.warn('Failed to load reading salons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
  }, []);

  const handleToggleJoin = async (circleId: string) => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    await toggleJoinCircle(circleId);
  };

  const handleOpenCreateModal = () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    setIsCreateOpen(true);
  };

  // Filter circles
  const myFoundedCircles = circles.filter(
    (c) => c.founderEmail && user?.email && c.founderEmail.toLowerCase() === user.email.toLowerCase()
  );

  const baseList = activeTab === 'all' ? circles : myFoundedCircles;

  const filteredCircles = baseList.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.currentBook.toLowerCase().includes(q) ||
      (c.author && c.author.toLowerCase().includes(q)) ||
      (c.topic && c.topic.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-[13px] font-mono text-[#8c5e43] hover:text-[#1c1c1c] transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Literary Community</span>
        </Link>

        <div className="border-b border-[#eceae4] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-[#8c5e43] mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Sanctuary Guilds Directory</span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#1c1c1c] tracking-tight-section">
              All Reading Salons & Circles
            </h1>
            <p className="text-[15px] text-[#5f5f5d] mt-1.5 max-w-2xl leading-relaxed">
              Explore every active gathering circle and literary guild. Converse with fellow readers, debate timeless philosophy, and attend weekly salons.
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
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#fcfbf8] border border-[#eceae4] p-3 rounded-container shadow-sm">
        {/* Side-by-side Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                : 'bg-[#fcfbf8] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4] hover:text-[#1c1c1c]'
            }`}
          >
            <span>All Salons</span>
            <span className={`text-[11px] font-mono ${activeTab === 'all' ? 'text-white/70' : 'text-[#8c5e43]'}`}>
              ({circles.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('founded')}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border flex items-center gap-2 ${
              activeTab === 'founded'
                ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                : 'bg-[#fcfbf8] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4] hover:text-[#1c1c1c]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#8c5e43]" />
            <span>My Founded Circles</span>
            <span className={`text-[11px] font-mono ${activeTab === 'founded' ? 'text-white/70' : 'text-[#8c5e43]'}`}>
              ({myFoundedCircles.length})
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-[#8c5e43] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by book, author, or salon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-full pl-9 pr-3 py-1.5 text-[13px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
          />
        </div>
      </div>

      {/* Grid or Empty States */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-[#5f5f5d]">
          <Loader2 className="w-6 h-6 animate-spin text-[#8c5e43]" />
          <span className="text-[13px] font-mono">Gathering active salons from sanctuary archives...</span>
        </div>
      ) : activeTab === 'founded' && !isLoggedIn ? (
        <div className="text-center py-16 bg-[#fcfbf8] border border-dashed border-[#eceae4] rounded-card space-y-3">
          <Users className="w-8 h-8 text-[#8c5e43] mx-auto opacity-70" />
          <h3 className="text-lg font-medium text-[#1c1c1c]">Sign In to View Your Founded Circles</h3>
          <p className="text-[14px] text-[#5f5f5d] max-w-md mx-auto">
            Sign in to access, edit, and oversee the reading salons you have founded.
          </p>
          <Button variant="primary" size="sm" onClick={openAuthModal} className="gap-2 shadow-button-inset">
            <span>Sign In to Sanctuary</span>
          </Button>
        </div>
      ) : activeTab === 'founded' && myFoundedCircles.length === 0 ? (
        <div className="text-center py-16 bg-[#fcfbf8] border border-dashed border-[#eceae4] rounded-card space-y-3">
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
      ) : filteredCircles.length === 0 ? (
        <div className="text-center py-16 bg-[#fcfbf8] border border-dashed border-[#eceae4] rounded-card space-y-3">
          <BookOpen className="w-8 h-8 text-[#8c5e43] mx-auto opacity-70" />
          <h3 className="text-lg font-medium text-[#1c1c1c]">No Matching Salons Found</h3>
          <p className="text-[14px] text-[#5f5f5d] max-w-md mx-auto">
            No salons matched your search query "{searchQuery}". Try searching for another book title or author.
          </p>
          <Button variant="cream" size="sm" onClick={() => setSearchQuery('')} className="gap-2">
            <span>Clear Search</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCircles.map((circle) => {
            const isJoined = joinedCircleIds.includes(circle.id);
            const isFounder =
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
                    {isFounder ? (
                      <span className="text-[11px] font-mono text-[#8c5e43] bg-[#f7f4ed] px-2.5 py-0.5 rounded border border-[#eceae4] flex items-center gap-1.5 font-semibold">
                        <Crown className="w-3.5 h-3.5 text-[#8c5e43]" />
                        <span>Founder: You</span>
                      </span>
                    ) : (
                      <Badge variant="subtle">Weekly Salon</Badge>
                    )}
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

                <div className="pt-4 border-t border-[#eceae4] mt-5 flex items-center justify-between">
                  <span className="text-[12px] text-[#5f5f5d] flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Active Salon
                  </span>

                  {isFounder ? (
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
      )}

      {/* Creation Modal */}
      <CreateCircleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newCircle) => {
          setCircles((prev) => [newCircle, ...prev]);
        }}
      />

      {/* Edit Modal (Founder Only) */}
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
