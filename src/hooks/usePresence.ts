import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import * as presenceService from '../services/presence';
import type { OnlineUser } from '../services/presence';
import { 
  HEARTBEAT_INTERVAL_MS, 
  CLEANUP_INTERVAL_MS 
} from '../services/presence';
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

    // Set up heartbeat to keep user active
    // Updates lastSeen at configured interval (default: 30 seconds)
    const heartbeatInterval = setInterval(() => {
      presenceService.updateHeartbeat(currentUser.uid);
    }, HEARTBEAT_INTERVAL_MS);

    // Clean up inactive users at configured interval (default: 1 minute)
    const cleanupInterval = setInterval(() => {
      presenceService.cleanupInactiveUsers(currentUser.uid);
    }, CLEANUP_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(heartbeatInterval);
      clearInterval(cleanupInterval);
      // Note: Session cleanup is handled in AuthContext logout function
      // before the user is signed out, so no need to call setUserOffline here
    };
  }, [currentUser, myColor]);

  return {
    onlineUsers,
    myColor,
  };
};

export default usePresence;

