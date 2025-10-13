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
 * Subscribe to presence updates
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
      
      callback(users);
    },
    (error) => {
      console.error('Error subscribing to presence:', error);
    }
  );

  return unsubscribe;
};

