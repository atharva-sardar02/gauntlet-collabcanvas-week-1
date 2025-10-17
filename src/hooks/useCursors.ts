import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import * as cursorsService from '../services/cursors';
import type { CursorsMap } from '../services/cursors';
import { getRandomCursorColor } from '../utils/constants';

// Throttle cursor updates to 25 FPS (40ms intervals)
const CURSOR_UPDATE_THROTTLE = 40;

// Minimum movement threshold (pixels)
const MIN_MOVEMENT_THRESHOLD = 2;

/**
 * Custom hook for managing multiplayer cursors
 * @returns Cursors state and update function
 */
export const useCursors = () => {
  const { currentUser } = useAuth();
  const [cursors, setCursors] = useState<CursorsMap>({});
  const [userColor, setUserColor] = useState<string>('');
  
  // Refs for throttling
  const lastUpdateTime = useRef<number>(0);
  const lastPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Assign random cursor color to user on mount
  useEffect(() => {
    setUserColor(getRandomCursorColor());
  }, []);

  // Subscribe to cursor updates
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = cursorsService.subscribeToCursors((updatedCursors) => {
      // Filter out current user's cursor
      const otherCursors: CursorsMap = {};
      Object.keys(updatedCursors).forEach((userId) => {
        if (userId !== currentUser.uid) {
          otherCursors[userId] = updatedCursors[userId];
        }
      });
      setCursors(otherCursors);
    });

    // Set up disconnect cleanup (for network issues, crashes, etc.)
    cursorsService.setupDisconnectCleanup(currentUser.uid);

    return () => {
      unsubscribe();
      // Note: No need to call removeCursor here
      // - On logout: cleanupUserSession in AuthContext handles it BEFORE signOut
      // - On disconnect/crash: onDisconnect() handler marks as offline
    };
  }, [currentUser]);

  /**
   * Update cursor position with throttling and movement threshold
   * Optimistic rendering - updates immediately without waiting for server
   */
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!currentUser || !userColor) return;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime.current;

      // Calculate distance moved
      const distanceMoved = Math.sqrt(
        Math.pow(x - lastPosition.current.x, 2) +
        Math.pow(y - lastPosition.current.y, 2)
      );

      // Only update if enough time has passed AND cursor moved significantly
      if (
        timeSinceLastUpdate >= CURSOR_UPDATE_THROTTLE &&
        distanceMoved >= MIN_MOVEMENT_THRESHOLD
      ) {
        const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        
        cursorsService.updateCursorPosition(
          currentUser.uid,
          x,
          y,
          userName,
          userColor
        );

        lastUpdateTime.current = now;
        lastPosition.current = { x, y };
      }
    },
    [currentUser, userColor]
  );

  return {
    cursors,
    userColor,
    updateCursorPosition,
  };
};

export default useCursors;

