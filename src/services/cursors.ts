import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { rtdb } from './firebase';

// Realtime Database Schema (Task 6.1):
// Path: /sessions/global-canvas-v1/{userId}
// Structure:
// {
//   displayName: string,
//   cursorColor: string,
//   cursorX: number,
//   cursorY: number,
//   lastSeen: timestamp
// }

const CANVAS_ID = 'global-canvas-v1';

// Inactivity timeout: 2 minutes (must match presence.ts)
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

export interface CursorData {
  displayName: string;
  cursorColor: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number | object;
}

export interface CursorsMap {
  [userId: string]: CursorData;
}

/**
 * Update cursor position for current user
 * @param userId - Current user's ID
 * @param x - Cursor X position on canvas
 * @param y - Cursor Y position on canvas
 * @param name - User's display name
 * @param color - User's cursor color
 */
export const updateCursorPosition = async (
  userId: string,
  x: number,
  y: number,
  name: string,
  color: string
): Promise<void> => {
  try {
    const cursorRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
    
    await set(cursorRef, {
      displayName: name,
      cursorColor: color,
      cursorX: x,
      cursorY: y,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating cursor position:', error);
  }
};

/**
 * Subscribe to all cursors in the canvas (filters inactive users)
 * @param callback - Function to call when cursors update
 * @returns Unsubscribe function
 */
export const subscribeToCursors = (
  callback: (cursors: CursorsMap) => void
): (() => void) => {
  const cursorsRef = ref(rtdb, `sessions/${CANVAS_ID}`);

  const unsubscribe = onValue(
    cursorsRef,
    (snapshot) => {
      const cursors: CursorsMap = {};
      const now = Date.now();
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((userId) => {
          const userData = data[userId];
          
          // Filter out inactive users
          // If lastSeen is a server timestamp object, keep it (assume active)
          if (typeof userData.lastSeen === 'object') {
            cursors[userId] = userData;
          } else if (typeof userData.lastSeen === 'number') {
            const timeSinceLastSeen = now - userData.lastSeen;
            
            // Only include cursors from users active within timeout
            if (timeSinceLastSeen < INACTIVITY_TIMEOUT_MS) {
              cursors[userId] = userData;
            }
          }
        });
      }
      
      callback(cursors);
    },
    (error) => {
      console.error('Error subscribing to cursors:', error);
    }
  );

  return unsubscribe;
};

/**
 * Remove cursor when user disconnects
 * Sets up auto-cleanup on disconnect
 * @param userId - User's ID
 */
export const removeCursor = async (userId: string): Promise<void> => {
  try {
    const cursorRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
    await set(cursorRef, null);
  } catch (error) {
    console.error('Error removing cursor:', error);
  }
};

/**
 * Set up auto-cleanup on disconnect
 * @param userId - User's ID
 */
export const setupDisconnectCleanup = (userId: string): void => {
  const cursorRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
  
  // Automatically remove cursor when user disconnects
  onDisconnect(cursorRef).set(null).catch((error) => {
    console.error('Error setting up disconnect cleanup:', error);
  });
};

