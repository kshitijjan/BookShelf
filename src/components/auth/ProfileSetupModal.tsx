import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Archive,
  Compass,
  Feather,
  Library,
  Check,
  Award,
  ChevronDown,
  Pencil,
  Mail,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  SCHOLARLY_RANKS,
  READING_PERSONALITIES,
  CURATED_GENRES,
  generateTasteProfile,
} from '../../utils/tasteProfile';
import { Button } from '../ui/Button';

// Goal options starting from 6 to 48 in steps of 2
const PRESET_GOALS = [
  6, 8, 10, 12, 14, 16, 18, 20, 22, 24,
  26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48,
];

export const ProfileSetupModal: React.FC = () => {
  const { user, isProfileSetupOpen, closeProfileSetup, saveProfile, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [scholarlyRank, setScholarlyRank] = useState(user?.scholarlyRank || '');
  const [challengeGoal, setChallengeGoal] = useState<number>(user?.challengeGoal || 12);
  const [isCustomGoal, setIsCustomGoal] = useState<boolean>(false);
  const [customGoalInput, setCustomGoalInput] = useState<string>('');
  const [personalities, setPersonalities] = useState<string[]>(user?.personalities || []);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(user?.selectedGenres || []);

  useEffect(() => {
    if (isProfileSetupOpen) {
      setFirstName(user?.firstName || '');
      setLastName(user?.lastName || '');
      setScholarlyRank(user?.scholarlyRank || '');
      setPersonalities(user?.personalities || []);
      setSelectedGenres(user?.selectedGenres || []);

      const currentGoal = user?.challengeGoal || 12;
      setChallengeGoal(currentGoal);
      if (PRESET_GOALS.includes(currentGoal)) {
        setIsCustomGoal(false);
        setCustomGoalInput('');
      } else {
        setIsCustomGoal(true);
        setCustomGoalInput(String(currentGoal));
      }
    }
  }, [isProfileSetupOpen, user]);

  useEffect(() => {
    if (isProfileSetupOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isProfileSetupOpen]);

  if (!isProfileSetupOpen) return null;

  const currentTasteProfile = generateTasteProfile(selectedGenres);

  const togglePersonality = (title: string) => {
    setPersonalities((prev) => {
      if (prev.includes(title)) {
        return prev.filter((p) => p !== title);
      } else {
        if (prev.length >= 3) {
          // keep max 3
          return [...prev.slice(1), title];
        }
        return [...prev, title];
      }
    });
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((g) => g !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  const handleSelectPresetGoal = (goal: number) => {
    setChallengeGoal(goal);
    setIsCustomGoal(false);
    setCustomGoalInput('');
  };

  const handleEnableCustomGoal = () => {
    setIsCustomGoal(true);
    setCustomGoalInput(String(challengeGoal || 12));
  };

  const handleCustomGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomGoalInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setChallengeGoal(parsed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    if (!scholarlyRank) return;
    if (personalities.length === 0) return;
    if (selectedGenres.length < 2) return;

    const finalGoal = isCustomGoal
      ? parseInt(customGoalInput, 10) || challengeGoal || 12
      : challengeGoal || 12;

    saveProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      scholarlyRank,
      challengeGoal: finalGoal > 0 ? finalGoal : 12,
      personalities,
      selectedGenres,
      tasteProfile: currentTasteProfile,
      isOnboarded: true,
    });
  };

  const getPersonalityIcon = (iconName: string) => {
    switch (iconName) {
      case 'Archive':
        return <Archive className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      case 'Compass':
        return <Compass className="w-4 h-4" />;
      case 'Feather':
        return <Feather className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Library':
        return <Library className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const selectedRankMeta = SCHOLARLY_RANKS.find((r) => r.title === scholarlyRank);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#fcfbf8] border border-[#eceae4] rounded-container shadow-2xl parchment-texture book-spine-left max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at Top with Close Button */}
        <div className="border-b border-[#eceae4] px-6 sm:px-8 pt-6 pb-4 shrink-0 flex items-start justify-between gap-4 bg-[#fcfbf8]">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#8c5e43]">
              <Award className="w-3.5 h-3.5" />
              <span>Community Onboarding</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1c1c1c] mt-1">
              Cultivate Your Shelf Identity
            </h2>
            <p className="text-[14px] text-[#5f5f5d] mt-1">
              Personalize your name, reading goals, reading archetypes, and synthesize your bespoke taste profile.
            </p>
          </div>
          <button
            onClick={closeProfileSetup}
            className="p-2 rounded-full hover:bg-[rgba(28,28,28,0.06)] text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors shrink-0 -mt-1 -mr-2"
            aria-label="Close setup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-7 modal-scrollable">
          {/* Section 1: Account Identity & Scholarly Title */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#1c1c1c] font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1c1c1c] text-[#fcfbf8] text-[11px] flex items-center justify-center">
                  1
                </span>
                <span>Account Identity & Scholarly Title</span>
              </h3>
              <span className="text-[11px] font-mono text-[#8c5e43]">
                Member since {user?.memberSince || 'October 2026'}
              </span>
            </div>

            {/* Account Credentials / Primary Identity Badge */}
            <div className="bg-[#f7f4ed] border border-[#eceae4] rounded-standard p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1c1c1c] text-[#fcfbf8] flex items-center justify-center font-editorial text-base font-semibold shadow-button-inset shrink-0">
                  {((firstName[0] || user?.firstName?.[0] || 'K') + (lastName[0] || user?.lastName?.[0] || '')).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#1c1c1c]">
                      {firstName.trim() ? `${firstName} ${lastName}`.trim() : 'Sanctuary Reader'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#8c5e43] bg-[#fcfbf8] px-1.5 py-0.5 rounded border border-[#eceae4]">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Verified Account</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#5f5f5d] mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#8c5e43]" />
                    <span className="font-mono text-[#1c1c1c]">{user?.email || 'reader@bookshelf.sanctuary'}</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-[#5f5f5d] self-start sm:self-auto">
                Synced from Sanctuary Login
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[12px] font-medium text-[#5f5f5d] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name..."
                  className="w-full bg-[#f7f4ed] border border-[#eceae4] focus-warm rounded-standard px-3.5 py-2 text-[14px] text-[#1c1c1c]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#5f5f5d] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name..."
                  className="w-full bg-[#f7f4ed] border border-[#eceae4] focus-warm rounded-standard px-3.5 py-2 text-[14px] text-[#1c1c1c]"
                />
              </div>
            </div>

            {/* Scholarly Rank Dropdown */}
            <div>
              <label className="block text-[12px] font-medium text-[#5f5f5d] mb-1">
                Scholarly Title / Honorific Badge *
              </label>
              <div className="relative">
                <select
                  required
                  value={scholarlyRank}
                  onChange={(e) => setScholarlyRank(e.target.value)}
                  className="w-full appearance-none bg-[#f7f4ed] border border-[#eceae4] focus-warm rounded-standard px-3.5 py-2.5 text-[14px] text-[#1c1c1c] pr-10 cursor-pointer"
                >
                  <option value="" disabled>
                    Select your scholarly title / rank...
                  </option>
                  {SCHOLARLY_RANKS.map((rank) => (
                    <option key={rank.id} value={rank.title}>
                      {rank.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#5f5f5d] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {selectedRankMeta && (
                <p className="text-[12px] text-[#8c5e43] mt-1.5 italic font-serif-quote">
                  "{selectedRankMeta.description}"
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Annual Reading Challenge Goal (6 to 48 in steps of 2, plus Other) */}
          <div className="space-y-3.5 pt-3 border-t border-[#eceae4]">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#1c1c1c] font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1c1c1c] text-[#fcfbf8] text-[11px] flex items-center justify-center">
                  2
                </span>
                <span>Annual Reading Challenge Goal</span>
              </h3>
              <span className="text-[12px] font-mono font-semibold text-[#8c5e43]">
                {challengeGoal} volumes / year
              </span>
            </div>
            <p className="text-[13px] text-[#5f5f5d]">
              Choose how many volumes you aim to read this year (default is 12 books, 1 per month). You can adjust this anytime:
            </p>

            {/* Presets Grid: 6 to 48 in gap of 2, plus Other with pencil */}
            <div className="p-3 bg-[#f7f4ed] border border-[#eceae4] rounded-card space-y-3">
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {PRESET_GOALS.map((goal) => {
                  const isSelected = !isCustomGoal && challengeGoal === goal;
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleSelectPresetGoal(goal)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-mono transition-all border flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset font-semibold'
                          : 'bg-[#fcfbf8] text-[#1c1c1c] border-[#eceae4] hover:bg-[#eceae4]'
                      }`}
                    >
                      <span>{goal}</span>
                      {goal === 12 && (
                        <span className={`text-[10px] ${isSelected ? 'text-[#fcfbf8]/80' : 'text-[#8c5e43]'}`}>
                          (Default)
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* 'Other' Option with Pencil */}
                <button
                  type="button"
                  onClick={handleEnableCustomGoal}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-mono transition-all border flex items-center gap-1.5 ${
                    isCustomGoal
                      ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset font-semibold'
                      : 'bg-[#fcfbf8] text-[#1c1c1c] border-[#eceae4] hover:bg-[#eceae4]'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5 text-[#8c5e43]" />
                  <span>Other</span>
                  {isCustomGoal && <span>({challengeGoal})</span>}
                </button>
              </div>

              {/* Custom Input when 'Other' is selected */}
              {isCustomGoal && (
                <div className="p-3 bg-[#fcfbf8] rounded-standard border border-[#8c5e43]/60 flex items-center gap-3 animate-fade-in shadow-sm">
                  <div className="p-2 rounded-full bg-[#f7f4ed] border border-[#eceae4] text-[#8c5e43]">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-mono uppercase text-[#8c5e43] font-semibold mb-0.5">
                      Custom Number of Books:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customGoalInput}
                      onChange={handleCustomGoalChange}
                      placeholder="e.g. 50, 75, 100..."
                      className="w-full bg-[#f7f4ed] border border-[#eceae4] focus-warm rounded-standard px-3 py-1.5 text-[14px] text-[#1c1c1c] font-mono"
                      autoFocus
                    />
                  </div>
                  <span className="text-[12px] text-[#5f5f5d] font-mono shrink-0 pt-4">
                    books / year
                  </span>
                </div>
              )}

              {/* Target Cadence Helper */}
              <div className="flex items-center justify-between text-[12px] font-mono text-[#5f5f5d] pt-1 border-t border-[#eceae4]/70">
                <span>Calculated Cadence:</span>
                <span className="text-[#1c1c1c] font-semibold">
                  {challengeGoal >= 52
                    ? `~${(challengeGoal / 52).toFixed(1)} volumes every week`
                    : challengeGoal >= 12
                    ? `~${(challengeGoal / 12).toFixed(1)} volumes every month`
                    : `1 volume every ${(12 / challengeGoal).toFixed(1)} months`}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Reading Personality */}
          <div className="space-y-3.5 pt-3 border-t border-[#eceae4]">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#1c1c1c] font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1c1c1c] text-[#fcfbf8] text-[11px] flex items-center justify-center">
                  3
                </span>
                <span>Reading Personality Archetype</span>
              </h3>
              <span className="text-[12px] text-[#5f5f5d]">Select 1 to 3</span>
            </div>
            <p className="text-[13px] text-[#5f5f5d]">
              Choose how you experience and inhabit books:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {READING_PERSONALITIES.map((item) => {
                const isSelected = personalities.includes(item.title);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePersonality(item.title)}
                    className={`relative p-3 rounded-card text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#f7f4ed] border-[#1c1c1c] shadow-button-inset'
                        : 'bg-[#fcfbf8] border-[#eceae4] hover:border-[rgba(28,28,28,0.25)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`p-1.5 rounded-full border ${
                            isSelected
                              ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c]'
                              : 'bg-[rgba(28,28,28,0.03)] text-[#8c5e43] border-[#eceae4]'
                          }`}
                        >
                          {getPersonalityIcon(item.iconName)}
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#1c1c1c] text-[#fcfbf8] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="text-[13px] font-semibold text-[#1c1c1c]">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-[#5f5f5d] mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[12px] text-[#5f5f5d] font-mono bg-[#f7f4ed] px-3 py-1.5 rounded-standard border border-[#eceae4] inline-block">
              Current display:{' '}
              <span className="text-[#1c1c1c] font-semibold">
                {personalities.length > 0 ? personalities.join(' & ') : 'None selected (choose 1 to 3)'}
              </span>
            </div>
          </div>

          {/* Section 4: Genres -> Generates Taste Profile */}
          <div className="space-y-3.5 pt-3 border-t border-[#eceae4]">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#1c1c1c] font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1c1c1c] text-[#fcfbf8] text-[11px] flex items-center justify-center">
                  4
                </span>
                <span>Genres & Taste Profile</span>
              </h3>
              <span
                className={`text-[12px] font-mono ${
                  selectedGenres.length >= 2 ? 'text-[#8c5e43]' : 'text-amber-700'
                }`}
              >
                {selectedGenres.length >= 2
                  ? `${selectedGenres.length} chosen`
                  : 'Choose at least 2'}
              </span>
            </div>
            <p className="text-[13px] text-[#5f5f5d]">
              Select the genres you read most. Your unique Taste Profile will synthesize in real time:
            </p>

            <div className="flex flex-wrap gap-2">
              {CURATED_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-3 py-1.5 rounded-full text-[13px] border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#1c1c1c] text-[#fcfbf8] border-[#1c1c1c] shadow-button-inset'
                        : 'bg-[#f7f4ed] text-[rgba(28,28,28,0.85)] border-[#eceae4] hover:bg-[#eceae4]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#fcfbf8]" />}
                    <span>{genre.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Real-time Generated Taste Profile Banner */}
            <div className="bg-[#f7f4ed] border border-[#eceae4] rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-book-sheet">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#8c5e43] font-semibold">
                  Synthesized Taste Profile
                </span>
                <div className="font-editorial text-2xl font-bold text-[#1c1c1c] mt-0.5 tracking-tight-sub min-h-[32px] flex items-center">
                  {selectedGenres.length >= 2 ? (
                    currentTasteProfile
                  ) : selectedGenres.length === 1 ? (
                    <span className="text-[#5f5f5d] text-[16px] font-sans font-normal italic">
                      Select 1 more genre to synthesize profile...
                    </span>
                  ) : (
                    <span className="text-[#5f5f5d] text-[16px] font-sans font-normal italic">
                      Select at least 2 genres above...
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[12px] text-[#5f5f5d] max-w-xs">
                Derived directly from your genre combination to reflect your aesthetic reading stance.
              </div>
            </div>
          </div>

          </div>

          {/* Action Buttons - Fixed at Bottom */}
          <div className="px-6 sm:px-8 py-4 border-t border-[#eceae4] flex items-center justify-between gap-3 shrink-0 bg-[#fcfbf8]">
            <button
              type="button"
              onClick={() => {
                closeProfileSetup();
                logout();
              }}
              className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#8c5e43] hover:text-red-700 transition-colors"
              title="Sign out of sanctuary"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="cream"
                onClick={closeProfileSetup}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  !firstName.trim() ||
                  !scholarlyRank ||
                  personalities.length === 0 ||
                  selectedGenres.length < 2
                }
                className="gap-2 shadow-button-inset"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save & Update Sanctuary</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
