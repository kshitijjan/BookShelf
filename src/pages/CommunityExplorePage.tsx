import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PenTool,
  Search,
  Heart,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Send,
  Loader2,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { soundManager } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import {
  fetchAllMarginNotes,
  inscribeMarginNote,
  likeMarginNote,
  addCommentToNote,
} from '../services/marginNotesApi';
import { MarginNote } from '../types/book';
import { BookSearchAutocomplete } from '../components/books/BookSearchAutocomplete';
import confetti from 'canvas-confetti';

export const CommunityExplorePage: React.FC = () => {
  const { user } = useAuth();

  const [notes, setNotes] = useState<MarginNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookFilter, setSelectedBookFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'top' | 'recent' | 'discussed'>('top');

  // Interactive Inscribe Modal / Drawer
  const [isWritingNote, setIsWritingNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBook, setNewBook] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newSnippet, setNewSnippet] = useState('');
  const [newText, setNewText] = useState('');


  // Interactive Discussions state: which notes have comments expanded
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentIds, setSubmittingCommentIds] = useState<string[]>([]);

  // Likes state
  const [likedNoteIds, setLikedNoteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookshelf_liked_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadAllNotes = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllMarginNotes({
        search: searchQuery,
        bookTitle: selectedBookFilter,
        sort: sortBy,
      });
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes for explore page:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllNotes();
  }, [selectedBookFilter, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAllNotes();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, likes: isCurrentlyLiked ? Math.max(0, n.likes - 1) : n.likes + 1 } : n
      )
    );

    try {
      await likeMarginNote(id, user?.email, !isCurrentlyLiked);
    } catch (err) {
      console.warn('Error liking note:', err);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.trim() || !newSnippet.trim() || !newText.trim()) return;

    setIsSubmitting(true);
    const readerName = user
      ? `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0]
      : 'You (The Reader)';
    const readerHandle = user ? `@${user.email.split('@')[0]}` : '@you_in_the_margins';
    const readerAvatar =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    try {
      const createdNote = await inscribeMarginNote({
        bookTitle: newBook.trim(),
        bookAuthor: newAuthor.trim() || undefined,
        passageSnippet: newSnippet.trim(),
        noteText: newText.trim(),
        readerName,
        readerHandle,
        readerAvatar,
        userId: user?.email,
      });

      setNotes((prev) => [createdNote, ...prev]);
      setNewBook('');
      setNewAuthor('');
      setNewSnippet('');
      setNewText('');
      setIsWritingNote(false);
      soundManager.playStampSound();

      confetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#1c1c1c', '#eceae4', '#8c5e43'],
      });
    } catch (err) {
      console.error('Failed to inscribe note:', err);
      alert('Could not save note to database. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComments = (noteId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  const handleAddComment = async (noteId: string) => {
    const text = commentInputs[noteId]?.trim();
    if (!text) return;

    setSubmittingCommentIds((prev) => [...prev, noteId]);
    const readerName = user
      ? `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0]
      : 'Fellow Reader';
    const readerAvatar =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    try {
      const res = await addCommentToNote(noteId, text, readerName, readerAvatar);
      if (res.success && res.comments) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, comments: res.comments } : n))
        );
        setCommentInputs((prev) => ({ ...prev, [noteId]: '' }));
        soundManager.playStampSound();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingCommentIds((prev) => prev.filter((id) => id !== noteId));
    }
  };

  // Extract unique book titles for filter pills
  const availableBooks = ['All', 'The Memory Police', 'Exhalation', 'Days at the Morisaki Bookshop', 'Piranesi', 'The Myth of Sisyphus', 'Atomic Habits', 'One Hundred Years of Solitude'];

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-[#eceae4] pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Link
            to="/community"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>The Salon</span>
          </Link>
          <span className="text-[#eceae4]">•</span>
          <span className="text-[12px] uppercase font-mono tracking-wider text-[#8c5e43]">
            Community Archive
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#1c1c1c] tracking-tight-section">
              The Public Margins
            </h1>
            <p className="text-[16px] text-[#5f5f5d] mt-2 max-w-2xl leading-relaxed">
              Every copy carries a quiet conversation between reader and prose. Inscribe your reflections, compare notes with kindred minds, and leave your pencil mark in the margins.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsWritingNote(!isWritingNote)}
            className="gap-2 shrink-0 shadow-button-inset"
          >
            <PenTool className="w-4 h-4" />
            <span>{isWritingNote ? 'Close Desk' : 'Inscribe a Note'}</span>
          </Button>
        </div>
      </div>

      {/* Inscribe Note Drawer / Form */}
      {isWritingNote && (
        <form
          onSubmit={handleSubmitNote}
          className="bg-[#fcfbf8] border border-[#eceae4] rounded-card p-6 space-y-4 shadow-book-sheet parchment-texture animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#eceae4] pb-3">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#8c5e43]" />
              <h3 className="font-serif-quote text-[16px] font-semibold text-[#1c1c1c]">
                Inscribe Marginalia to the Public Archive
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsWritingNote(false)}
              className="text-[13px] text-[#5f5f5d] hover:text-[#1c1c1c]"
            >
              Cancel
            </button>
          </div>

          <div>
            <BookSearchAutocomplete
              selectedTitle={newBook}
              selectedAuthor={newAuthor}
              onSelect={(book) => {
                setNewBook(book.title);
                setNewAuthor(book.author);
              }}
              required
            />
          </div>


          <div>
            <label className="block text-[12px] text-[#1c1c1c] font-medium mb-1">
              Quoted Line <span className="text-[#8c5e43]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. If you lose the memory of a perfume, does the flower still exist?"
              value={newSnippet}
              onChange={(e) => setNewSnippet(e.target.value)}
              className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-standard px-3.5 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]/70"
            />
          </div>

          <div>
            <label className="block text-[12px] text-[#1c1c1c] font-medium mb-1">
              Your Reflection <span className="text-[#8c5e43]">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="What did this line stir inside you? Write with candor..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-standard p-3 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]/70"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[12px] text-[#5f5f5d] font-mono">
              Permanently archived to the community ledger.
            </span>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preserving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Press Ink to Page</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Search, Filter & Sort Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5f5f5d] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quotes, reflections, books..."
              className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard pl-10 pr-4 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]/70 shadow-sm"
            />
          </div>

          {/* Sort Tabs */}
          <div className="inline-flex rounded-standard border border-[#eceae4] p-1 bg-[#fcfbf8] shrink-0 self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setSortBy('top')}
              className={`px-3 py-1 text-[13px] rounded-standard transition-all ${
                sortBy === 'top'
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] shadow-button-inset'
                  : 'text-[#5f5f5d] hover:text-[#1c1c1c]'
              }`}
            >
              Top Loved
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1 text-[13px] rounded-standard transition-all ${
                sortBy === 'recent'
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] shadow-button-inset'
                  : 'text-[#5f5f5d] hover:text-[#1c1c1c]'
              }`}
            >
              Latest
            </button>
          </div>
        </div>

        {/* Book Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#5f5f5d] mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Volume:
          </span>
          {availableBooks.map((book) => (
            <button
              key={book}
              onClick={() => setSelectedBookFilter(book)}
              className={`px-3 py-1 rounded-full text-[12px] whitespace-nowrap transition-colors border ${
                selectedBookFilter === book
                  ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                  : 'bg-[#fcfbf8] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4] hover:text-[#1c1c1c]'
              }`}
            >
              {book}
            </button>
          ))}
        </div>
      </div>

      {/* Main Marginalia Feed */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#5f5f5d]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8c5e43]" />
          <span className="text-[14px] font-mono">Loading reader marginalia archive...</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-[#fcfbf8] border border-[#eceae4] rounded-card p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#8c5e43] mx-auto opacity-60" />
          <h3 className="font-editorial text-xl text-[#1c1c1c]">No notes inscribed yet</h3>
          <p className="text-[14px] text-[#5f5f5d] max-w-sm mx-auto">
            Be the first reader to leave a pencil mark for this volume.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsWritingNote(true)}>
            Inscribe the First Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {notes.map((note) => {
            const isLiked = likedNoteIds.includes(note.id);
            const isCommentsOpen = !!expandedComments[note.id];
            const commentsList = Array.isArray(note.comments) ? note.comments : [];

            return (
              <div
                key={note.id}
                className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-6 transition-all flex flex-col justify-between shadow-book-sheet parchment-texture relative group"
              >
                <div>
                  {/* Book & Page Header */}
                  <div className="flex items-center justify-between text-[13px] mb-3 text-[#5f5f5d]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-[#1c1c1c] group-hover:text-[#8c5e43] transition-colors">
                        {note.bookTitle}
                      </span>
                      {note.bookAuthor && note.bookAuthor !== 'Archived Writer' && (
                        <span className="text-[12px] text-[#5f5f5d] truncate">
                          by {note.bookAuthor}
                        </span>
                      )}
                    </div>
                    {note.pageNumber ? (
                      <span className="font-mono text-[11px] bg-[rgba(28,28,28,0.03)] px-2 py-0.5 rounded border border-[#eceae4] shrink-0">
                        Page {note.pageNumber}
                      </span>
                    ) : null}
                  </div>

                  {/* Quoted Passage Snippet */}
                  <div className="border-l-2 border-[#8c5e43] pl-3.5 py-1.5 italic font-serif-quote text-[15px] text-[#1c1c1c] mb-3.5 leading-relaxed bg-[#f7f4ed]/50 rounded-r">
                    {note.passageSnippet.startsWith('“') || note.passageSnippet.startsWith('"')
                      ? note.passageSnippet
                      : `“${note.passageSnippet}”`}
                  </div>

                  {/* Reader's Reflection Note */}
                  <p className="text-[14px] text-[rgba(28,28,28,0.85)] leading-relaxed font-sans mb-5 whitespace-pre-line">
                    {note.noteText}
                  </p>
                </div>

                {/* Footer: Reader Info + Interactive Actions */}
                <div className="pt-3.5 border-t border-[#eceae4] space-y-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          note.readerAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={note.readerName}
                        className="w-7 h-7 rounded-full object-cover border border-[#eceae4]"
                      />
                      <div>
                        <span className="font-medium text-[#1c1c1c] block leading-tight">
                          {note.readerName}
                        </span>
                        <span className="text-[#5f5f5d] text-[11px]">
                          {note.timestamp || 'Today'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Comments / Discussions Button */}
                      <button
                        type="button"
                        onClick={() => toggleComments(note.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] transition-all ${
                          isCommentsOpen
                            ? 'bg-[#eceae4] text-[#1c1c1c] border-[rgba(28,28,28,0.25)]'
                            : 'bg-[#f7f4ed] text-[#5f5f5d] border-[#eceae4] hover:bg-[#eceae4] hover:text-[#1c1c1c]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{commentsList.length}</span>
                      </button>

                      {/* Heart / Like Button */}
                      <button
                        type="button"
                        onClick={() => handleLike(note.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] transition-all ${
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

                  {/* Expandable Discussions Thread */}
                  {isCommentsOpen && (
                    <div className="pt-3 border-t border-[#eceae4]/70 space-y-2.5 animate-fade-in bg-[#f7f4ed] p-3 rounded-standard">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#5f5f5d] uppercase tracking-wider">
                        <span>Marginal Reflections ({commentsList.length})</span>
                      </div>

                      {commentsList.length === 0 ? (
                        <p className="text-[12px] text-[#5f5f5d] italic py-1">
                          No thoughts left yet. Start the dialogue below.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {commentsList.map((comm) => (
                            <div
                              key={comm.id}
                              className="bg-[#fcfbf8] p-2.5 rounded border border-[#eceae4] text-[12px] space-y-1"
                            >
                              <div className="flex items-center justify-between font-medium text-[#1c1c1c]">
                                <span>{comm.readerName}</span>
                                <span className="text-[10px] text-[#5f5f5d] font-mono">
                                  {comm.createdAt}
                                </span>
                              </div>
                              <p className="text-[12px] text-[rgba(28,28,28,0.85)] leading-relaxed">
                                {comm.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputs[note.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [note.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(note.id);
                            }
                          }}
                          placeholder="Write a thought in the margin..."
                          className="flex-1 bg-[#fcfbf8] border border-[#eceae4] rounded px-2.5 py-1.5 text-[12px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]/70"
                        />
                        <button
                          type="button"
                          disabled={submittingCommentIds.includes(note.id) || !commentInputs[note.id]?.trim()}
                          onClick={() => handleAddComment(note.id)}
                          className="px-2.5 py-1.5 rounded bg-[#1c1c1c] hover:bg-[#2b2b2b] text-[#fcfbf8] text-[12px] disabled:opacity-40 transition-colors shrink-0 inline-flex items-center gap-1"
                        >
                          {submittingCommentIds.includes(note.id) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
