import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart, MessageSquare, PenTool, Users, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { soundManager } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import { fetchTopMarginNotes, inscribeMarginNote, likeMarginNote } from '../../services/marginNotesApi';
import { MarginNote } from '../../types/book';
import { BookSearchAutocomplete } from '../books/BookSearchAutocomplete';
import confetti from 'canvas-confetti';

interface Chapter4MarginNotesProps {
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const Chapter4MarginNotes: React.FC<Chapter4MarginNotesProps> = ({
  onNextPage,
  onPrevPage,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notes, setNotes] = useState<MarginNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedNoteIds, setLikedNoteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookshelf_liked_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWritingNote, setIsWritingNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNoteBook, setNewNoteBook] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('');
  const [newNoteSnippet, setNewNoteSnippet] = useState('');
  const [newNoteText, setNewNoteText] = useState('');


  useEffect(() => {
    let isCancelled = false;
    async function loadNotes() {
      setIsLoading(true);
      try {
        const topNotes = await fetchTopMarginNotes();
        if (!isCancelled) {
          setNotes(topNotes);
        }
      } catch (err) {
        console.error('Error fetching top margin notes:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }
    loadNotes();
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

    // Optimistic UI update
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === id ? { ...n, likes: isCurrentlyLiked ? Math.max(0, n.likes - 1) : n.likes + 1 } : n
      )
    );

    // Sync to database
    try {
      await likeMarginNote(id, user?.email, !isCurrentlyLiked);
    } catch (err) {
      console.warn('Failed to sync like to server:', err);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBook.trim() || !newNoteSnippet.trim() || !newNoteText.trim()) {
      return;
    }

    setIsSubmitting(true);
    const readerName = user
      ? `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0]
      : 'You (The Reader)';
    const readerHandle = user ? `@${user.email.split('@')[0]}` : '@you_in_the_margins';
    const readerAvatar =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    try {
      const createdNote = await inscribeMarginNote({
        bookTitle: newNoteBook.trim(),
        bookAuthor: newNoteAuthor.trim() || undefined,
        passageSnippet: newNoteSnippet.trim(),
        noteText: newNoteText.trim(),
        readerName,
        readerHandle,
        readerAvatar,
        userId: user?.email,
      });

      // Insert immediately in front of user in the list
      setNotes((prev) => [createdNote, ...prev]);
      setNewNoteBook('');
      setNewNoteAuthor('');
      setNewNoteSnippet('');
      setNewNoteText('');
      setIsWritingNote(false);
      soundManager.playStampSound();

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#1c1c1c', '#eceae4', '#8c5e43'],
      });
    } catch (err) {
      console.error('Failed to inscribe note:', err);
      alert('Could not save your note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToExplore = () => {
    soundManager.playPageTurn();
    navigate('/community/explore');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 sm:py-10 px-4 sm:px-8 max-w-5xl mx-auto parchment-texture book-spine-left book-edge-sheets rounded-container border border-[#eceae4]">
      {/* Chapter Header */}
      <div className="flex items-center justify-between border-b border-[#eceae4] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-serif-quote text-[13px] text-[#8c5e43] font-bold tracking-widest uppercase">
            Chapter IV
          </span>
          <span className="text-[#eceae4]">•</span>
          <span className="text-[12px] uppercase tracking-wider text-[#5f5f5d] font-mono">
            Margin Notes
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#5f5f5d] font-mono">
          <span>Reader Marginalia</span>
          <span className="text-[#eceae4]">•</span>
          <span>Folio 04</span>
        </div>
      </div>

      {/* Main Section Content */}
      <div className="space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c1c] tracking-tight-section">
              Pencil Marks in the Margins
            </h2>
            <p className="text-[15px] text-[#5f5f5d] mt-1 max-w-2xl">
              The sacred conversation between reader and page. Explore annotations, epiphanies, and reflections shared across the community.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsWritingNote(!isWritingNote)}
            className="gap-2 shrink-0 shadow-button-inset"
          >
            <PenTool className="w-4 h-4" />
            <span>{isWritingNote ? 'Close Desk' : 'Inscribe a Note'}</span>
          </Button>
        </div>

        {/* Modal / Inscribe Form */}
        {isWritingNote && (
          <form
            onSubmit={handleSubmitNote}
            className="bg-[#fcfbf8] border border-[#eceae4] rounded-card p-5 space-y-3.5 shadow-book-sheet animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-[#eceae4] pb-2">
              <div className="flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-[#8c5e43]" />
                <span className="text-[12px] font-mono uppercase tracking-wider text-[#8c5e43] font-semibold">
                  Inscribe New Marginalia Entry
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsWritingNote(false)}
                className="text-[12px] text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors"
              >
                Cancel
              </button>
            </div>

            <div>
              <BookSearchAutocomplete
                selectedTitle={newNoteBook}
                selectedAuthor={newNoteAuthor}
                onSelect={(book) => {
                  setNewNoteBook(book.title);
                  setNewNoteAuthor(book.author);
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
                value={newNoteSnippet}
                onChange={(e) => setNewNoteSnippet(e.target.value)}
                className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-standard px-3 py-1.5 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]/70"
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
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full bg-[#f7f4ed] border border-[#eceae4] rounded-standard p-3 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]/70"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#5f5f5d] font-mono">
                All 3 fields are preserved permanently in the sanctuary archives.
              </span>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inscribing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Press Ink to Page</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Marginalia Grid - Top 4 Notes */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#5f5f5d]">
            <Loader2 className="w-6 h-6 animate-spin text-[#8c5e43]" />
            <span className="text-[13px] font-mono">Unfolding community marginalia...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.slice(0, 4).map((note) => {
              const isLiked = likedNoteIds.includes(note.id);
              return (
                <div
                  key={note.id}
                  className="bg-[#fcfbf8] border border-[#eceae4] hover:border-[rgba(28,28,28,0.35)] rounded-card p-5 transition-all flex flex-col justify-between shadow-book-sheet relative group"
                >
                  {/* Book & Page Reference Header */}
                  <div>
                    <div className="flex items-center justify-between text-[12px] mb-2 text-[#5f5f5d]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-medium text-[#1c1c1c]">
                          {note.bookTitle}
                        </span>
                        {note.bookAuthor && note.bookAuthor !== 'Archived Writer' && (
                          <span className="text-[11px] text-[#5f5f5d] truncate">
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
                    <div className="border-l-2 border-[#8c5e43] pl-3 py-1 italic font-serif-quote text-[14px] text-[#1c1c1c] mb-3 leading-relaxed">
                      {note.passageSnippet.startsWith('“') || note.passageSnippet.startsWith('"')
                        ? note.passageSnippet
                        : `“${note.passageSnippet}”`}
                    </div>

                    {/* Reader's Handwritten Note Style */}
                    <p className="text-[14px] text-[rgba(28,28,28,0.85)] leading-relaxed font-sans mb-4">
                      {note.noteText}
                    </p>
                  </div>

                  {/* Author Info & Heart */}
                  <div className="pt-3 border-t border-[#eceae4] flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <img
                        src={note.readerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={note.readerName}
                        className="w-6 h-6 rounded-full object-cover border border-[#eceae4]"
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

        {/* Live Reading Circles Teaser & Direct Portal to Explore Community */}
        <div className="bg-[#f7f4ed] border border-[#eceae4] hover:border-[rgba(28,28,28,0.3)] transition-all rounded-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#1c1c1c] text-[#fcfbf8] shadow-button-inset shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[14px] font-medium text-[#1c1c1c]">
                3 Active Reading Circles Gathering Tonight
              </h4>
              <p className="text-[12px] text-[#5f5f5d]">
                Join chapters discussing <span className="text-[#1c1c1c] font-medium">Exhalation</span> and <span className="text-[#1c1c1c] font-medium">The Shadow of the Wind</span>.
              </p>
            </div>
          </div>
          <button
            onClick={handleGoToExplore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-standard bg-[#fcfbf8] hover:bg-[#eceae4] border border-[#eceae4] hover:border-[#1c1c1c] text-[13px] font-medium text-[#1c1c1c] transition-all shadow-button-inset shrink-0 group"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#8c5e43]" />
            <span>Explore Community</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5f5f5d] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Chapter Navigation Footer */}
      <div className="pt-6 border-t border-[#eceae4] flex items-center justify-between mt-8 text-[14px]">
        <button
          onClick={() => {
            soundManager.playPageTurn();
            onPrevPage();
          }}
          className="inline-flex items-center gap-1.5 text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Chapter III: The Taste Alchemist</span>
        </button>

        <button
          onClick={() => {
            soundManager.playPageTurn();
            onNextPage();
          }}
          className="inline-flex items-center gap-1.5 font-medium text-[#1c1c1c] hover:underline underline-offset-4 group transition-colors"
        >
          <span>Chapter V: Epilogue & Colophon →</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
