import React, { useEffect } from 'react';
import { X, BookOpen, UserPlus, LogIn } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    isSignedIn,
    openProfileSetup,
    authModalMode,
    setAuthModalMode,
  } = useAuth();

  useEffect(() => {
    if (isAuthModalOpen && isSignedIn) {
      closeAuthModal();
      openProfileSetup();
    }
  }, [isAuthModalOpen, isSignedIn, closeAuthModal, openProfileSetup]);

  useEffect(() => {
    if (isAuthModalOpen && !isSignedIn) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAuthModalOpen, isSignedIn]);

  if (!isAuthModalOpen || isSignedIn) return null;

  const isSignUp = authModalMode === 'sign-up';

  const clerkAppearance = {
    layout: {
      socialButtonsPlacement: 'top' as const,
      showOptionalFields: false,
    },
    variables: {
      colorPrimary: '#1c1c1c',
      colorBackground: 'transparent',
      colorText: '#1c1c1c',
      colorTextSecondary: '#5f5f5d',
      colorInputBackground: '#f7f4ed',
      colorInputText: '#1c1c1c',
      borderRadius: '6px',
    },
    elements: {
      rootBox: 'w-full overflow-visible',
      cardBox: 'bg-transparent shadow-none border-0 w-full p-0 overflow-visible',
      card: 'bg-transparent shadow-none border-0 p-0 w-full overflow-visible',
      main: 'overflow-visible',
      form: 'overflow-visible',
      header: 'hidden',
      headerTitle: 'hidden',
      headerSubtitle: 'hidden',
      socialButtonsBlockButton:
        'w-full bg-[#f7f4ed] border border-[#eceae4] hover:bg-[#eceae4] text-[#1c1c1c] text-[14px] rounded-standard py-2.5 px-4 shadow-sm transition-all',
      socialButtonsBlockButtonText: 'font-medium text-[#1c1c1c]',
      dividerRow: 'my-3.5',
      dividerLine: 'bg-[#eceae4]',
      dividerText: 'text-[11px] font-mono uppercase text-[#5f5f5d]',
      formFieldRow: 'mb-3.5 overflow-visible',
      formFieldInputGroup: 'overflow-visible my-0.5',
      formFieldLabel: 'text-[12px] font-medium text-[#5f5f5d] mb-1.5 block',
      formFieldInput:
        'w-full bg-[#f7f4ed] border border-[#eceae4] text-[#1c1c1c] rounded-standard text-[14px] py-2.5 px-3.5 focus:border-[#1c1c1c] transition-colors outline-none box-border my-0.5',
      formButtonPrimary:
        'w-full bg-[#1c1c1c] text-[#fcfbf8] hover:bg-[#2c2c2c] rounded-standard text-[14px] shadow-button-inset py-2.5 mt-2 transition-all',
      identityPreviewText: 'text-[#1c1c1c] font-medium text-[14px]',
      identityPreviewEditButton: 'text-[#8c5e43] hover:text-[#1c1c1c] text-[12px]',
      otpCodeField: 'overflow-visible py-2',
      otpCodeFieldInputs: 'overflow-visible py-1 flex justify-center gap-2',
      otpCodeFieldInput:
        'bg-[#f7f4ed] border border-[#eceae4] text-[#1c1c1c] text-xl font-mono text-center rounded-standard focus:border-[#1c1c1c] box-border !h-12 !w-11 m-0.5 !leading-none',
      formResendCodeLink: 'text-[#8c5e43] hover:text-[#1c1c1c] text-[13px]',
      footer: 'hidden',
      footerAction: 'hidden',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-md bg-[#fcfbf8] border border-[#eceae4] rounded-container p-6 sm:p-8 shadow-2xl parchment-texture book-spine-left my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[rgba(28,28,28,0.06)] text-[#5f5f5d] hover:text-[#1c1c1c] transition-colors z-20"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-standard bg-[#1c1c1c] text-[#fcfbf8] flex items-center justify-center mx-auto mb-3 shadow-button-inset">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#8c5e43] font-semibold">
            {isSignUp ? 'BookShelf Sanctuary' : 'Reader Sanctuary'}
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1c1c1c] mt-1">
            {isSignUp ? 'Build Your Shelf' : 'Welcome Back'}
          </h2>
          <p className="text-[14px] text-[#5f5f5d] mt-1.5 leading-relaxed">
            {isSignUp
              ? 'Join a vibrant community of thoughtful readers, share margin notes with fellow book lovers, and curate your personal reading sanctuary.'
              : 'Sign in to access your curated library, active reading salons, and recorded margin notes.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-[#eceae4] mb-5">
          <button
            type="button"
            onClick={() => setAuthModalMode('sign-up')}
            className={`flex-1 pb-2.5 text-[13px] font-medium transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              isSignUp
                ? 'border-[#1c1c1c] text-[#1c1c1c] font-semibold'
                : 'border-transparent text-[#5f5f5d] hover:text-[#1c1c1c]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('sign-in')}
            className={`flex-1 pb-2.5 text-[13px] font-medium transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              !isSignUp
                ? 'border-[#1c1c1c] text-[#1c1c1c] font-semibold'
                : 'border-transparent text-[#5f5f5d] hover:text-[#1c1c1c]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Clerk Auth Component */}
        <div className="clerk-auth-container w-full">
          {isSignUp ? (
            <SignUp routing="virtual" appearance={clerkAppearance} />
          ) : (
            <SignIn routing="virtual" appearance={clerkAppearance} />
          )}
        </div>

        {/* Mode Toggle Footer */}
        <div className="mt-4 pt-3 border-t border-[#eceae4]/70 text-center">
          {isSignUp ? (
            <p className="text-[13px] text-[#5f5f5d]">
              Already have a shelf?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('sign-in')}
                className="font-medium text-[#1c1c1c] underline underline-offset-4 hover:text-[#8c5e43] transition-colors"
              >
                Sign in here
              </button>
            </p>
          ) : (
            <p className="text-[13px] text-[#5f5f5d]">
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('sign-up')}
                className="font-medium text-[#1c1c1c] underline underline-offset-4 hover:text-[#8c5e43] transition-colors"
              >
                Create your shelf
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
