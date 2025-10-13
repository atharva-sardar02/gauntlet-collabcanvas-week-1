import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import * as presenceService from '../services/presence';
import type { OnlineUser } from '../services/presence';
import { getRandomCursorColor } from '../utils/constants';

/**
 * Custom hook for managing user presence
 * @returns Online users and current user's color
 */
export const usePresence = (userColor?: string) => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [myColor] = useState<string>(userColor || getRandomCursorColor());

  // Set user online and subscribe to presence
  useEffect(() => {
    if (!currentUser) return;

    const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    
    // Set current user as online
    presenceService.setUserOnline(currentUser.uid, userName, myColor);

    // Subscribe to all online users
    const unsubscribe = presenceService.subscribeToPresence((users) => {
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      // Set user as offline on unmount
      presenceService.setUserOffline(currentUser.uid);
    };
  }, [currentUser, myColor]);

  return {
    onlineUsers,
    myColor,
  };
};

export default usePresence;

