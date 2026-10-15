import React from 'react';
import { ShelfPage } from './ShelfPage';

interface ProfilePageProps {
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
}

/**
 * Reader Profile content is now unified with Personal Shelf on /shelf.
 * This component re-exports ShelfPage to ensure any direct component usages remain fully compatible.
 */
export const ProfilePage: React.FC<ProfilePageProps> = (props) => {
  return <ShelfPage {...props} />;
};
