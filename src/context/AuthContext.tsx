import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import { UserProfile, UserShelfBook } from '../types/user';
import { Book } from '../types/book';
import { generateTasteProfile } from '../utils/tasteProfile';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  isProfileSetupOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileSetup: () => void;
  closeProfileSetup: () => void;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string) => void;
  logout: () => void;
  saveProfile: (updates: Partial<UserProfile>) => void;
  addBookToShelf: (book: Book, status: 'read' | 'reading_list', yearRead?: number) => Promise<void>;
  removeBookFromShelf: (bookId: string) => Promise<void>;
  toggleJoinCircle: (circleId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'bookshelf_user_profile';

const getInitialMonthYear = (): string => {
  const date = new Date();
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useClerkUser();
  const clerk = useClerk();

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Sync Clerk sign-in state to user profile from Neon PostgreSQL
  useEffect(() => {
    let isCancelled = false;

    async function syncUserProfile() {
      if (!isLoaded) return;

      if (!isSignedIn || !clerkUser) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const clerkId = clerkUser.id;
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';

      setIsLoadingProfile(true);

      try {
        const params = new URLSearchParams();
        if (clerkId) params.set('clerkId', clerkId);
        if (email) params.set('email', email);

        const res = await fetch(`/api/profile?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile && isCancelled === false) {
            const dbProfile = data.profile;
            const hydrated: UserProfile = {
              firstName: dbProfile.firstName || clerkUser.firstName || '',
              lastName: dbProfile.lastName || clerkUser.lastName || '',
              email: dbProfile.email || email,
              scholarlyRank: dbProfile.scholarlyRank || 'Bibliophile Scholar',
              personalities: Array.isArray(dbProfile.personalities) ? dbProfile.personalities : [],
              selectedGenres: Array.isArray(dbProfile.selectedGenres) ? dbProfile.selectedGenres : [],
              tasteProfile: dbProfile.tasteProfile || '',
              memberSince: dbProfile.memberSince || getInitialMonthYear(),
              challengeGoal: dbProfile.challengeGoal ?? 12,
              booksRead: dbProfile.booksRead ?? 0,
              pagesRead: dbProfile.pagesRead ?? 0,
              marginNotesCount: dbProfile.marginNotesCount ?? 0,
              guildsJoined: dbProfile.guildsJoined ?? 0,
              isOnboarded: !!dbProfile.isOnboarded,
              shelfBooks: Array.isArray(dbProfile.shelfBooks) ? dbProfile.shelfBooks : [],
              joinedCircles: Array.isArray(dbProfile.joinedCircles) ? dbProfile.joinedCircles : [],
            };

            setUser(hydrated);
            setIsAuthModalOpen(false);

            // If user has already completed onboarding in Neon, do NOT open the setup modal
            if (hydrated.isOnboarded) {
              setIsProfileSetupOpen(false);
            } else if (isAuthModalOpen) {
              // User was in the middle of authenticating
              setIsProfileSetupOpen(true);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching profile from Neon Postgres:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
      }

      // If user profile is not found in database, initialize draft
      if (!isCancelled) {
        setUser((prev) => {
          if (prev && prev.isOnboarded) return prev;
          return {
            firstName: clerkUser.firstName || prev?.firstName || '',
            lastName: clerkUser.lastName || prev?.lastName || '',
            email: email || prev?.email || '',
            scholarlyRank: prev?.scholarlyRank || '',
            personalities: prev?.personalities || [],
            selectedGenres: prev?.selectedGenres || [],
            tasteProfile: prev?.tasteProfile || '',
            memberSince: prev?.memberSince || getInitialMonthYear(),
            challengeGoal: prev?.challengeGoal || 12,
            booksRead: prev?.booksRead || 0,
            pagesRead: prev?.pagesRead || 0,
            marginNotesCount: prev?.marginNotesCount || 0,
            guildsJoined: prev?.guildsJoined || 0,
            isOnboarded: false,
            shelfBooks: prev?.shelfBooks || [],
          };
        });

        // Only auto-open profile setup if user just signed in through AuthModal
        if (isAuthModalOpen) {
          setIsAuthModalOpen(false);
          setIsProfileSetupOpen(true);
        }
      }
    }

    syncUserProfile();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUser]);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openProfileSetup = () => setIsProfileSetupOpen(true);
  const closeProfileSetup = () => setIsProfileSetupOpen(false);

  const loginWithGoogle = () => {
    if (clerk?.openSignIn) {
      clerk.openSignIn();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const loginWithEmail = () => {
    if (clerk?.openSignIn) {
      clerk.openSignIn();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const logout = async () => {
    try {
      if (clerk?.signOut) {
        await clerk.signOut();
      }
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthModalOpen(false);
    setIsProfileSetupOpen(false);
  };

  const saveProfile = async (updates: Partial<UserProfile>) => {
    const currentGenres = updates.selectedGenres || user?.selectedGenres || [];
    const computedTaste = updates.tasteProfile || generateTasteProfile(currentGenres);

    const updatedProfile: UserProfile = {
      firstName: updates.firstName !== undefined ? updates.firstName : (user?.firstName || clerkUser?.firstName || ''),
      lastName: updates.lastName !== undefined ? updates.lastName : (user?.lastName || clerkUser?.lastName || ''),
      email: updates.email || user?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'reader@bookshelf.sanctuary',
      scholarlyRank: updates.scholarlyRank || user?.scholarlyRank || 'Bibliophile Scholar',
      personalities: updates.personalities || user?.personalities || [],
      selectedGenres: currentGenres,
      tasteProfile: computedTaste,
      shelfBooks: updates.shelfBooks !== undefined ? updates.shelfBooks : (user?.shelfBooks || []),
      memberSince: updates.memberSince || user?.memberSince || getInitialMonthYear(),
      challengeGoal: updates.challengeGoal ?? user?.challengeGoal ?? 12,
      booksRead: updates.booksRead ?? user?.booksRead ?? 0,
      pagesRead: updates.pagesRead ?? user?.pagesRead ?? 0,
      marginNotesCount: updates.marginNotesCount ?? user?.marginNotesCount ?? 0,
      guildsJoined: updates.guildsJoined ?? user?.guildsJoined ?? 1,
      isOnboarded: true,
    };

    setUser(updatedProfile);
    setIsProfileSetupOpen(false);

    // Persist permanently to Neon PostgreSQL via Prisma
    try {
      const payload = {
        clerkId: clerkUser?.id || updatedProfile.email,
        ...updatedProfile,
      };

      await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Failed to persist profile to Neon PostgreSQL:', err);
    }
  };

  const addBookToShelf = async (book: Book, status: 'read' | 'reading_list', yearRead?: number) => {
    if (!user) return;
    const chosenYear = yearRead || new Date().getFullYear();
    const currentShelf: UserShelfBook[] = Array.isArray(user.shelfBooks) ? [...user.shelfBooks] : [];

    // Filter out if book already exists in shelf to prevent duplicates
    const filtered = currentShelf.filter(item => item.book?.id !== book.id);
    filtered.unshift({
      book,
      status,
      yearRead: status === 'read' ? chosenYear : undefined,
      dateAdded: new Date().toISOString(),
    });

    const readBooks = filtered.filter(item => item.status === 'read');
    const totalPages = readBooks.reduce((sum, item) => sum + (Number(item.book?.pages) || 0), 0);
    const readThisYear = readBooks.filter(item => item.yearRead === new Date().getFullYear());

    const updatedUser: UserProfile = {
      ...user,
      shelfBooks: filtered,
      pagesRead: totalPages,
      booksRead: readThisYear.length,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    } catch {}

    try {
      await fetch('/api/profile/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: clerkUser?.id || user.email,
          email: user.email,
          action: 'add',
          book,
          status,
          yearRead: chosenYear,
        }),
      });
    } catch (err) {
      console.error('Failed to sync shelf book to server:', err);
    }
  };

  const removeBookFromShelf = async (bookId: string) => {
    if (!user) return;
    const currentShelf: UserShelfBook[] = Array.isArray(user.shelfBooks) ? [...user.shelfBooks] : [];
    const filtered = currentShelf.filter(item => item.book?.id !== bookId);

    const readBooks = filtered.filter(item => item.status === 'read');
    const totalPages = readBooks.reduce((sum, item) => sum + (Number(item.book?.pages) || 0), 0);
    const readThisYear = readBooks.filter(item => item.yearRead === new Date().getFullYear());

    const updatedUser: UserProfile = {
      ...user,
      shelfBooks: filtered,
      pagesRead: totalPages,
      booksRead: readThisYear.length,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    } catch {}

    try {
      await fetch('/api/profile/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: clerkUser?.id || user.email,
          email: user.email,
          action: 'remove',
          bookId,
        }),
      });
    } catch (err) {
      console.error('Failed to sync shelf removal to server:', err);
    }
  };

  const toggleJoinCircle = async (circleId: string): Promise<boolean> => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    const currentJoined = Array.isArray(user.joinedCircles) ? user.joinedCircles : [];
    const isJoined = currentJoined.includes(circleId);
    const updatedJoined = isJoined
      ? currentJoined.filter((id) => id !== circleId)
      : [...currentJoined, circleId];

    const updatedUser: UserProfile = {
      ...user,
      joinedCircles: updatedJoined,
      guildsJoined: updatedJoined.length,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    } catch {}

    try {
      const clerkId = clerkUser?.id || user.email;
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId,
          email: user.email,
          joinedCircles: updatedJoined,
          guildsJoined: updatedJoined.length,
        }),
      });

      await fetch('/api/circles/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circleId,
          userEmail: user.email,
          action: isJoined ? 'leave' : 'join',
        }),
      });
    } catch (err) {
      console.warn('Error saving joined circle to profile:', err);
    }

    return !isJoined;
  };

  // User is considered logged in when Clerk is signed in AND user profile is marked onboarded
  const isUserLoggedIn = !!isSignedIn && (!!user && user.isOnboarded);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: isUserLoggedIn,
        isSignedIn: !!isSignedIn,
        isLoading: isLoadingProfile,
        isAuthModalOpen,
        isProfileSetupOpen,
        openAuthModal,
        closeAuthModal,
        openProfileSetup,
        closeProfileSetup,
        loginWithGoogle,
        loginWithEmail,
        logout,
        saveProfile,
        addBookToShelf,
        removeBookFromShelf,
        toggleJoinCircle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
