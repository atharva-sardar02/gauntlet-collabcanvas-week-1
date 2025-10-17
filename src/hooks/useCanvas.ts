import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import * as canvasService from '../services/canvas';
import type { Shape } from '../contexts/CanvasContext';

/**
 * Custom hook for canvas operations with real-time sync
 * @returns Canvas state and operations
 */
export const useCanvas = () => {
  const { currentUser } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time shape updates
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = canvasService.subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
    });

    // Enable offline persistence
    canvasService.enableOfflinePersistence().catch(console.error);

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Add a new shape to the canvas
   * Returns the ID of the created shape
   */
  const addShape = useCallback(
    async (shapeData: Omit<Shape, 'id'>): Promise<string | null> => {
      if (!currentUser) {
        setError('User not authenticated');
        return null;
      }

      try {
        setError(null);
        const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        const shapeId = await canvasService.createShape(shapeData, currentUser.uid, userName);
        return shapeId;
      } catch (err) {
        console.error('Error adding shape:', err);
        setError('Failed to create shape');
        return null;
      }
    },
    [currentUser]
  );

  /**
   * Bulk add multiple shapes to the canvas in a single transaction
   * Much more efficient than calling addShape multiple times
   * Returns array of created shape IDs
   */
  const bulkAddShapes = useCallback(
    async (shapesData: Array<Omit<Shape, 'id'>>): Promise<string[]> => {
      if (!currentUser) {
        setError('User not authenticated');
        return [];
      }

      try {
        setError(null);
        const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        const shapeIds = await canvasService.bulkCreateShapes(shapesData, currentUser.uid, userName);
        return shapeIds;
      } catch (err) {
        console.error('Error bulk adding shapes:', err);
        setError('Failed to create shapes');
        return [];
      }
    },
    [currentUser]
  );

  /**
   * Update an existing shape
   */
  const updateShape = useCallback(
    async (shapeId: string, updates: Partial<Shape>) => {
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      try {
        setError(null);
        const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        await canvasService.updateShape(shapeId, updates, currentUser.uid, userName);
      } catch (err) {
        console.error('Error updating shape:', err);
        setError('Failed to update shape');
      }
    },
    [currentUser]
  );

  /**
   * Delete a shape from the canvas
   */
  const deleteShape = useCallback(async (shapeId: string) => {
    try {
      setError(null);
      await canvasService.deleteShape(shapeId);
    } catch (err) {
      console.error('Error deleting shape:', err);
      setError('Failed to delete shape');
    }
  }, []);

  /**
   * Lock a shape for editing
   */
  const lockShape = useCallback(
    async (shapeId: string, userColor: string) => {
      if (!currentUser) return;

      try {
        const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        await canvasService.lockShape(shapeId, currentUser.uid, userName, userColor);
      } catch (err) {
        console.error('Error locking shape:', err);
      }
    },
    [currentUser]
  );

  /**
   * Unlock a shape
   */
  const unlockShape = useCallback(async (shapeId: string) => {
    try {
      await canvasService.unlockShape(shapeId);
    } catch (err) {
      console.error('Error unlocking shape:', err);
    }
  }, []);

  /**
   * Recreate a shape with its original ID (for undo operations)
   */
  const recreateShape = useCallback(
    async (shape: Shape) => {
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      try {
        setError(null);
        await canvasService.recreateShapeWithId(shape, currentUser.uid);
      } catch (err) {
        console.error('Error recreating shape:', err);
        setError('Failed to recreate shape');
      }
    },
    [currentUser]
  );

  /**
   * Clear all shapes from the canvas
   */
  const clearAllShapes = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await canvasService.clearAllShapes();
    } catch (err) {
      console.error('Error clearing canvas:', err);
      setError('Failed to clear canvas');
      throw err;
    }
  }, []);

  return {
    shapes,
    loading,
    error,
    addShape,
    bulkAddShapes,
    updateShape,
    deleteShape,
    lockShape,
    unlockShape,
    recreateShape,
    clearAllShapes,
  };
};

export default useCanvas;

