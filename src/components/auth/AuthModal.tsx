import React, { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, isSignedIn, openProfileSetup } = useAuth();

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
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-standard bg-[#1c1c1c] text-[#fcfbf8] flex items-center justify-center mx-auto mb-3 shadow-button-inset">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#8c5e43] font-semibold">
            BookShelf Sanctuary
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1c1c1c] mt-1">
            Build Your Shelf
          </h2>
          <p className="text-[14px] text-[#5f5f5d] mt-1.5 leading-relaxed">
            Join a vibrant community of thoughtful readers, share margin notes with fellow book lovers, and curate your personal reading sanctuary.
          </p>
        </div>

        {/* Live Clerk SignIn Component cleanly integrated without card-in-card nesting */}
        <div className="clerk-auth-container w-full">
          <SignIn
            routing="virtual"
            appearance={{
              layout: {
                socialButtonsPlacement: 'top',
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
                rootBox: 'w-full',
                cardBox: 'bg-transparent shadow-none border-0 w-full p-0',
                card: 'bg-transparent shadow-none border-0 p-0 w-full',
                header: 'hidden',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton:
                  'w-full bg-[#f7f4ed] border border-[#eceae4] hover:bg-[#eceae4] text-[#1c1c1c] text-[14px] rounded-standard py-2.5 px-4 shadow-sm transition-all',
                socialButtonsBlockButtonText: 'font-medium text-[#1c1c1c]',
                dividerRow: 'my-3.5',
                dividerLine: 'bg-[#eceae4]',
                dividerText: 'text-[11px] font-mono uppercase text-[#5f5f5d]',
                formFieldRow: 'mb-3.5',
                formFieldLabel: 'text-[12px] font-medium text-[#5f5f5d] mb-1.5 block',
                formFieldInput:
                  'w-full bg-[#f7f4ed] border border-[#eceae4] text-[#1c1c1c] rounded-standard text-[14px] py-2.5 px-3.5 focus:border-[#1c1c1c] transition-colors outline-none',
                formButtonPrimary:
                  'w-full bg-[#1c1c1c] text-[#fcfbf8] hover:bg-[#2c2c2c] rounded-standard text-[14px] shadow-button-inset py-2.5 mt-2 transition-all',
                identityPreviewText: 'text-[#1c1c1c] font-medium text-[14px]',
                identityPreviewEditButton: 'text-[#8c5e43] hover:text-[#1c1c1c] text-[12px]',
                otpCodeFieldInput:
                  'bg-[#f7f4ed] border border-[#eceae4] text-[#1c1c1c] text-xl font-mono text-center rounded-standard focus:border-[#1c1c1c]',
                formResendCodeLink: 'text-[#8c5e43] hover:text-[#1c1c1c] text-[13px]',
                footer: 'hidden',
                footerAction: 'hidden',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
