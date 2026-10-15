import React, { useState, useEffect } from 'react';
import { X, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { ReadingCircle } from '../../types/book';
import { updateReadingCircle } from '../../services/readingCirclesApi';
import { useAuth } from '../../context/AuthContext';

interface EditCircleModalProps {
  isOpen: boolean;
  circle: ReadingCircle | null;
  onClose: () => void;
  onSuccess: (circle: ReadingCircle) => void;
}

export const EditCircleModal: React.FC<EditCircleModalProps> = ({
  isOpen,
  circle,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [circleName, setCircleName] = useState('');
  const [circleBook, setCircleBook] = useState('');
  const [circleAuthor, setCircleAuthor] = useState('');
  const [circleMeeting, setCircleMeeting] = useState('');
  const [circleTopic, setCircleTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (circle) {
      setCircleName(circle.name || '');
      setCircleBook(circle.currentBook || '');
      setCircleAuthor(circle.author || '');
      setCircleMeeting(circle.meetingDate || '');
      setCircleTopic(circle.topic || '');
      setErrorMessage(null);
    }
  }, [circle, isOpen]);

  if (!isOpen || !circle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleName.trim() || !circleBook.trim()) return;

    if (!user?.email) {
      setErrorMessage('You must be signed in as the founder to edit this salon.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = await updateReadingCircle({
        id: circle.id,
        name: circleName.trim(),
        currentBook: circleBook.trim(),
        author: circleAuthor.trim() || 'Acclaimed Writer',
        meetingDate: circleMeeting.trim() || 'Sundays, 7:00 PM EST',
        topic: circleTopic.trim() || 'Literary Exploration & Deep Discussion',
        userEmail: user.email,
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Error editing circle:', err);
      setErrorMessage(err?.message || 'Failed to update salon. Only the founder may edit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1c1c]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fcfbf8] border border-[#eceae4] rounded-container p-6 sm:p-8 max-w-lg w-full shadow-book-sheet parchment-texture space-y-5">
        <div className="flex items-start justify-between border-b border-[#eceae4] pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#8c5e43] font-semibold flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              <span>Founder Salon Management</span>
            </span>
            <h3 className="font-editorial text-2xl font-semibold text-[#1c1c1c] mt-0.5">
              Edit Reading Salon
            </h3>
            <p className="text-[13px] text-[#5f5f5d] mt-1">
              Update the discussion volume, reading schedule, or conversation themes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#5f5f5d] hover:text-[#1c1c1c] p-1.5 rounded-full hover:bg-[#eceae4]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-standard flex items-center gap-2 text-[13px] text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#1c1c1c] mb-1">
              Salon Name <span className="text-[#8c5e43]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kyoto Tea & Prose Society"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard px-3 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1c1c1c] mb-1">
              Currently Reading Book <span className="text-[#8c5e43]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. The Book of Disquiet"
              value={circleBook}
              onChange={(e) => setCircleBook(e.target.value)}
              className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard px-3 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#1c1c1c] mb-1">
                Author
              </label>
              <input
                type="text"
                placeholder="e.g. Fernando Pessoa"
                value={circleAuthor}
                onChange={(e) => setCircleAuthor(e.target.value)}
                className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard px-3 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1c1c1c] mb-1">
                Meeting Schedule
              </label>
              <input
                type="text"
                placeholder="e.g. Thursdays, 8:00 PM EST"
                value={circleMeeting}
                onChange={(e) => setCircleMeeting(e.target.value)}
                className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard px-3 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1c1c1c] mb-1">
              Discussion Theme / Topic
            </label>
            <input
              type="text"
              placeholder="e.g. Melancholy, identity, and existential prose"
              value={circleTopic}
              onChange={(e) => setCircleTopic(e.target.value)}
              className="w-full bg-[#fcfbf8] border border-[#eceae4] rounded-standard px-3 py-2 text-[14px] text-[#1c1c1c] focus-warm placeholder-[#5f5f5d]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#eceae4]">
            <Button
              type="button"
              variant="cream"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 shadow-button-inset"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <span>Save Salon Changes</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
