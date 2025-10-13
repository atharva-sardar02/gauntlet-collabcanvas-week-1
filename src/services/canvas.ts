import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence,
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
 * Create a new shape in Firestore
 * @param shapeData - Shape data to create
 * @param userId - ID of user creating the shape
 */
export const createShape = async (
  shapeData: Omit<Shape, 'id'>,
  userId: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, 'canvas', CANVAS_ID);
    const snapshot = await getDoc(canvasRef);

    const shapes = snapshot.exists() ? snapshot.data().shapes || [] : [];

    const newShape: Shape = {
      ...shapeData,
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdBy: userId,
      createdAt: Date.now(),
      lastModifiedBy: userId,
      lastModifiedAt: Date.now(),
      isLocked: false,
      lockedBy: null,
      lockedByColor: null,
    };

    await setDoc(
      canvasRef,
      {
        shapes: [...shapes, newShape],
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error creating shape:', error);
    throw error;
  }
};

/**
 * Update an existing shape in Firestore
 * @param shapeId - ID of shape to update
 * @param updates - Partial shape data to update
 * @param userId - ID of user updating the shape
 */
export const updateShape = async (
  shapeId: string,
  updates: Partial<Shape>,
  userId: string
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
            ...updates,
            lastModifiedBy: userId,
            lastModifiedAt: Date.now(),
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

