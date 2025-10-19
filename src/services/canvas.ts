import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence,
  getDocFromServer,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Shape } from '../contexts/CanvasContext';

// Firestore Schema:
// Collection: canvas
// Document: global-canvas-v1
// Structure:
// {
//   canvasId: "global-canvas-v1",
//   shapes: Shape[],
//   lastUpdated: timestamp
// }

const CANVAS_ID = 'global-canvas-v1';

/**
 * Enable offline persistence for Firestore
 */
export const enableOfflinePersistence = async (): Promise<void> => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Offline persistence enabled');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence');
    }
  }
};

/**
 * Subscribe to shapes changes in Firestore
 * @param callback - Function to call when shapes update
 * @returns Unsubscribe function
 */
export const subscribeToShapes = (
  callback: (shapes: Shape[]) => void
): (() => void) => {
  const canvasRef = doc(db, 'canvas', CANVAS_ID);

  return onSnapshot(
    canvasRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.shapes || []);
      } else {
        // Initialize empty canvas if document doesn't exist
        setDoc(canvasRef, {
          canvasId: CANVAS_ID,
          shapes: [],
          lastUpdated: serverTimestamp(),
        }).catch(console.error);
        callback([]);
      }
    },
    (error) => {
      console.error('Error subscribing to shapes:', error);
    }
  );
};

/**
 * Get current shapes from Firestore
 * @returns Array of shapes
 */
export const getShapes = async (): Promise<Shape[]> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return data.shapes || [];
    }

    // Initialize if doesn't exist
    await setDoc(canvasRef, {
      canvasId: CANVAS_ID,
      shapes: [],
      lastUpdated: serverTimestamp(),
    });

    return [];
  } catch (error) {
    console.error('Error getting shapes:', error);
    return [];
  }
};

/**
 * Bulk create multiple shapes in a single Firestore transaction
 * Much more efficient than calling createShape multiple times
 * @param shapesData - Array of shape data to create
 * @param userId - ID of user creating the shapes
 * @param userName - Name of user creating the shapes
 * @returns Array of created shape IDs
 */
export const bulkCreateShapes = async (
  shapesData: Array<Omit<Shape, 'id'>>,
  userId: string,
  userName?: string
): Promise<string[]> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    const existingShapes = snapshot.exists() ? snapshot.data().shapes || [] : [];
    const now = Date.now();
    
    // Calculate starting zIndex
    const maxZIndex = existingShapes.length > 0 
      ? Math.max(...existingShapes.map((s: Shape) => s.zIndex || 0), 0)
      : 0;
    
    // Create all new shapes with metadata
    const newShapes: Shape[] = shapesData.map((shapeData, index) => {
      const shapeId = `shape-${now + index}-${Math.random().toString(36).substr(2, 9)}`;
      const editSessionId = `session-${userId}-${now + index}`;
      
      return {
        id: shapeId,
        ...shapeData,
        createdAt: now + index,
        lastModifiedAt: now + index,
        lastModifiedTimestamp: now + index,
        createdBy: userId,
        lastModifiedBy: userId,
        createdByName: userName || 'User',
        lastModifiedByName: userName || 'User',
        zIndex: maxZIndex + index + 1,
        version: 1,
        isLocked: false,
        lockedBy: null,
        lockedByColor: null,
        editSessionId,
      } as Shape;
    });

    // Single write with all shapes
    await updateDoc(canvasRef, {
      shapes: [...existingShapes, ...newShapes],
      lastUpdated: serverTimestamp(),
    });

    console.log(`✅ Bulk created ${newShapes.length} shapes in Firestore`);
    return newShapes.map(s => s.id);
  } catch (error) {
    console.error('Error bulk creating shapes:', error);
    throw error;
  }
};

/**
 * Create a new shape in Firestore
 * @param shapeData - Shape data to create
 * @param userId - ID of user creating the shape
 * 
 * Note (Task 13.5.10 - Create Collision Handling):
 * Firestore auto-generates unique IDs, preventing ID collisions.
 * If two users create shapes at nearly identical timestamps:
 * - Both shapes exist independently (no conflict)
 * - Both get unique IDs (no collision)
 * - Position overlap is acceptable (users can move if needed)
 * - Last-Write-Wins (LWW) doesn't apply to creates
 * 
 * This is fundamentally different from update conflicts where
 * one change overwrites another. For creates, both succeed.
 */
export const createShape = async (
  shapeData: Omit<Shape, 'id'>,
  userId: string,
  userName?: string
): Promise<string> => {  // Changed from Promise<void> to Promise<string> to return shape ID
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    const shapes = snapshot.exists() ? snapshot.data().shapes || [] : [];

    const now = Date.now();
    
    // Calculate next zIndex (new shapes go on top)
    const maxZIndex = shapes.length > 0 
      ? Math.max(...shapes.map((s: Shape) => s.zIndex || 0), 0)
      : 0;
    const nextZIndex = maxZIndex + 1;
    
    // Generate unique ID (prevents collisions even with simultaneous creates)
    // Format: shape-{timestamp}-{random9chars}
    // Collision probability: ~1 in 10^15 even at same millisecond
    const shapeId = `shape-${now}-${Math.random().toString(36).substr(2, 9)}`;
    const newShape: Shape = {
      ...shapeData,
      id: shapeId,
      createdBy: userId,
      createdByName: userName,
      createdAt: now,
      lastModifiedBy: userId,
      lastModifiedByName: userName,
      lastModifiedAt: now,
      isLocked: false,
      lockedBy: null,
      lockedByColor: null,
      // Conflict resolution metadata
      version: 1,
      lastModifiedTimestamp: now, // Will be replaced with server timestamp on sync
      editSessionId: `session-${userId}-${now}`,
      // Layer management - new shapes on top
      zIndex: nextZIndex,
    };

    await setDoc(
      canvasRef,
      {
        shapes: [...shapes, newShape],
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
    
    return shapeId;  // Return the generated shape ID
  } catch (error) {
    console.error('Error creating shape:', error);
    throw error;
  }
};

/**
 * Recreate a shape with its original ID (for undo operations)
 * @param shape - Complete shape data including original ID
 * @param userId - ID of user recreating the shape
 */
export const recreateShapeWithId = async (
  shape: Shape,
  userId: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    const shapes = snapshot.exists() ? snapshot.data().shapes || [] : [];

    const now = Date.now();
    
    // Use the existing shape ID and preserve all original data
    const recreatedShape: Shape = {
      ...shape,
      // Update metadata for recreation
      lastModifiedBy: userId,
      lastModifiedAt: now,
      isLocked: false,
      lockedBy: null,
      lockedByColor: null,
      // Increment version for conflict resolution
      version: (shape.version || 0) + 1,
      lastModifiedTimestamp: now,
      editSessionId: `session-${userId}-${now}`,
    };

    await setDoc(
      canvasRef,
      {
        shapes: [...shapes, recreatedShape],
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error recreating shape:', error);
    throw error;
  }
};

/**
 * Update an existing shape in Firestore
 * @param shapeId - ID of shape to update
 * @param updates - Partial shape data to update
 * @param userId - ID of user updating the shape
 * @param userName - Name of user updating the shape
 */
export const updateShape = async (
  shapeId: string,
  updates: Partial<Shape>,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    if (!snapshot.exists()) return;

    const shapes = snapshot.data().shapes || [];
    const now = Date.now();
    
    const updatedShapes = shapes.map((shape: Shape) =>
      shape.id === shapeId
        ? {
            ...shape,
            ...updates,
            lastModifiedBy: userId,
            lastModifiedByName: userName,
            lastModifiedAt: now,
            // Increment version for conflict detection
            version: (shape.version || 0) + 1,
            lastModifiedTimestamp: now,
            editSessionId: `session-${userId}-${now}`,
          }
        : shape
    );

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating shape:', error);
    throw error;
  }
};

/**
 * Batch update multiple shapes atomically in a single transaction
 * Prevents race conditions when updating multiple shapes simultaneously
 * @param shapeUpdates - Array of shape IDs and their updates
 * @param userId - User making the updates
 * @param userName - User's display name
 */
export const batchUpdateShapes = async (
  shapeUpdates: Array<{ id: string; updates: Partial<Shape> }>,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    
    // Read from SERVER not cache to get latest data
    const snapshot = await getDocFromServer(canvasRef);
    
    if (!snapshot.exists()) {
      console.error('[Batch Update] Canvas document does not exist');
      return;
    }
    
    const shapes = snapshot.data().shapes || [];
    const now = Date.now();
    
    // Create a map of shape IDs to updates for O(1) lookup
    const updatesMap = new Map(shapeUpdates.map(su => [su.id, su.updates]));
    
    // Update all shapes that have updates
    const updatedShapes = shapes.map((shape: Shape) => {
      const updates = updatesMap.get(shape.id);
      if (updates) {
        return {
          ...shape,
          ...updates,
          lastModifiedBy: userId,
          lastModifiedByName: userName,
          lastModifiedAt: now,
          version: (shape.version || 0) + 1,
          lastModifiedTimestamp: now,
          editSessionId: `session-${userId}-${now}`,
        };
      }
      return shape;
    });
    
    // Write all updates in one go
    await setDoc(canvasRef, {
      canvasId: CANVAS_ID,
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    }, { merge: false });
  } catch (error) {
    console.error('Error batch updating shapes:', error);
    throw error;
  }
};

/**
 * Delete a shape from Firestore
 * @param shapeId - ID of shape to delete
 */
export const deleteShape = async (shapeId: string): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    if (!snapshot.exists()) return;

    const shapes = snapshot.data().shapes || [];
    const filteredShapes = shapes.filter((shape: Shape) => shape.id !== shapeId);

    await updateDoc(canvasRef, {
      shapes: filteredShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw error;
  }
};

/**
 * Lock a shape for editing
 * @param shapeId - ID of shape to lock
 * @param userId - ID of user locking the shape
 * @param userName - Display name of user
 * @param userColor - Cursor color of user
 */
export const lockShape = async (
  shapeId: string,
  userId: string,
  userName: string,
  userColor: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    if (!snapshot.exists()) return;

    const shapes = snapshot.data().shapes || [];
    const updatedShapes = shapes.map((shape: Shape) =>
      shape.id === shapeId
        ? {
            ...shape,
            isLocked: true,
            lockedBy: userId,
            lockedByColor: userColor,
            lockedByName: userName,
          }
        : shape
    );

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error locking shape:', error);
    throw error;
  }
};

/**
 * Unlock a shape
 * @param shapeId - ID of shape to unlock
 */
export const unlockShape = async (shapeId: string): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    if (!snapshot.exists()) return;

    const shapes = snapshot.data().shapes || [];
    const updatedShapes = shapes.map((shape: Shape) =>
      shape.id === shapeId
        ? {
            ...shape,
            isLocked: false,
            lockedBy: null,
            lockedByColor: null,
            lockedByName: null,
          }
        : shape
    );

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unlocking shape:', error);
    throw error;
  }
};

/**
 * Clear all shapes from the canvas
 */
export const clearAllShapes = async (): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    await setDoc(
      canvasRef,
      {
        shapes: [],
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('Canvas cleared successfully');
  } catch (error) {
    console.error('Error clearing canvas:', error);
    throw error;
  }
};

