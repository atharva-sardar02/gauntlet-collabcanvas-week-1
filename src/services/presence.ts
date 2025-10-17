import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { rtdb } from './firebase';

// Presence Schema (Task 7.1):
// Path: /sessions/global-canvas-v1/{userId}
// Combined with cursor data:
// {
//   displayName: string,
//   cursorColor: string,
//   cursorX: number,
//   cursorY: number,
//   lastSeen: timestamp
// }

const CANVAS_ID = 'global-canvas-v1';

// Inactivity timeout: 2 minutes (120 seconds)
// Users inactive for this duration will be removed from active list
export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

// Heartbeat interval: 30 seconds
// How often to update the user's lastSeen timestamp
export const HEARTBEAT_INTERVAL_MS = 30 * 1000;

// Cleanup interval: 1 minute
// How often to check for and remove inactive users
export const CLEANUP_INTERVAL_MS = 60 * 1000;

export interface OnlineUser {
  userId: string;
  displayName: string;
  cursorColor: string;
  lastSeen: number | object;
}

/**
 * Set user as online
 * @param userId - User's ID
 * @param displayName - User's display name
 * @param color - User's cursor color
 */
export const setUserOnline = async (
  userId: string,
  displayName: string,
  color: string
): Promise<void> => {
  try {
    const userRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
    
    // Set user data with online status
    await set(userRef, {
      displayName,
      cursorColor: color,
      cursorX: 0,
      cursorY: 0,
      lastSeen: serverTimestamp(),
    });

    // Set up auto-offline on disconnect
    onDisconnect(userRef).set(null).catch(console.error);
  } catch (error) {
    console.error('Error setting user online:', error);
  }
};

/**
 * Set user as offline (remove from presence)
 * @param userId - User's ID
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
    await set(userRef, null);
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
};

/**
 * Update user's lastSeen timestamp (heartbeat)
 * @param userId - User's ID
 */
export const updateHeartbeat = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}/lastSeen`);
    await set(userRef, serverTimestamp());
  } catch (error) {
    console.error('Error updating heartbeat:', error);
  }
};

/**
 * Filter out inactive users based on lastSeen timestamp
 * @param users - Array of online users
 * @returns Active users only
 */
const filterActiveUsers = (users: OnlineUser[]): OnlineUser[] => {
  const now = Date.now();
  return users.filter((user) => {
    // If lastSeen is a server timestamp object, skip filtering (assume active)
    if (typeof user.lastSeen === 'object') {
      return true;
    }
    
    // Filter out users inactive for more than INACTIVITY_TIMEOUT_MS
    const timeSinceLastSeen = now - user.lastSeen;
    return timeSinceLastSeen < INACTIVITY_TIMEOUT_MS;
  });
};

/**
 * Clean up inactive users from the database
 * @param userId - Current user's ID to keep them active
 */
export const cleanupInactiveUsers = async (currentUserId: string): Promise<void> => {
  try {
    const presenceRef = ref(rtdb, `sessions/${CANVAS_ID}`);
    const snapshot = await new Promise<any>((resolve, reject) => {
      onValue(presenceRef, resolve, reject, { onlyOnce: true });
    });

    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();

      for (const userId of Object.keys(data)) {
        // Don't remove current user
        if (userId === currentUserId) continue;

        const lastSeen = data[userId].lastSeen;
        
        // Only check if lastSeen is a number (not a server timestamp object)
        if (typeof lastSeen === 'number') {
          const timeSinceLastSeen = now - lastSeen;
          
          if (timeSinceLastSeen > INACTIVITY_TIMEOUT_MS) {
            // Remove inactive user
            const userRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
            await set(userRef, null);
            console.log(`Removed inactive user: ${userId}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up inactive users:', error);
  }
};

/**
 * Subscribe to presence updates with inactivity filtering
 * @param callback - Function to call when online users change
 * @returns Unsubscribe function
 */
export const subscribeToPresence = (
  callback: (users: OnlineUser[]) => void
): (() => void) => {
  const presenceRef = ref(rtdb, `sessions/${CANVAS_ID}`);

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const users: OnlineUser[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((userId) => {
          users.push({
            userId,
            displayName: data[userId].displayName,
            cursorColor: data[userId].cursorColor,
            lastSeen: data[userId].lastSeen,
          });
        });
      }
      
      // Filter out inactive users before calling callback
      const activeUsers = filterActiveUsers(users);
      callback(activeUsers);
    },
    (error) => {
      console.error('Error subscribing to presence:', error);
    }
  );

  return unsubscribe;
};

