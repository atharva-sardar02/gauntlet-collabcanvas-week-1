import { useCallback, useRef, useEffect } from 'react';
import { useConflictIndicators } from '../components/Canvas/ConflictIndicator';
import { detectConflict, getConflictMessage, shouldNotifyUser, getConflictSeverity } from '../utils/conflictDetection';
import { logConflictResult } from '../utils/conflictLogger';
import { RateLimiter, UpdateBatcher } from '../utils/rateLimiter';
import type { Operation } from '../types/operations';
import type { Shape } from '../contexts/CanvasContext';

/**
 * Configuration for conflict resolution
 */
interface ConflictResolutionConfig {
  enableVisualFeedback?: boolean;
  enableLogging?: boolean;
  debounceMs?: number;
  maxUpdatesPerSecond?: number;
  batchUpdates?: boolean;
}

/**
 * Hook for managing conflict resolution
 * Handles simultaneous move conflicts, rapid edit storms, and delete vs edit conflicts
 */
export function useConflictResolution(
  userId: string | null,
  shapes: Shape[],
  config: ConflictResolutionConfig = {}
) {
  const {
    enableVisualFeedback = true,
    enableLogging = true,
    debounceMs = 100,
    maxUpdatesPerSecond = 10,
    batchUpdates = true,
  } = config;

  // Visual indicators
  const {
    showShapeIndicator,
    showToast,
    shapeIndicators,
    toasts,
    removeToast,
  } = useConflictIndicators();

  // Rate limiters for different operations
  const moveRateLimiter = useRef(
    new RateLimiter<Partial<Shape>>({
      maxUpdatesPerSecond,
      debounceMs,
      throttleMs: debounceMs,
      batchUpdates,
    })
  );

  const updateRateLimiter = useRef(
    new RateLimiter<Partial<Shape>>({
      maxUpdatesPerSecond,
      debounceMs: 50, // Faster for non-move updates
      throttleMs: 50,
      batchUpdates,
    })
  );

  // Batcher for rapid edit storms
  const updateBatcher = useRef(new UpdateBatcher<Partial<Shape>>(debounceMs));

  // Track pending operations for conflict detection
  const pendingOperations = useRef<Map<string, Operation>>(new Map());

  // Track shapes being edited by others
  const shapesBeingEdited = useRef<Map<string, { userId: string; userName: string }>>(
    new Map()
  );

  /**
   * Handle simultaneous move conflicts (Task 13.5.7)
   * Detects when two users drag the same shape at the same time
   */
  const handleMoveWithConflictDetection = useCallback(
    async (
      shapeId: string,
      updates: Partial<Shape>,
      updateCallback: (id: string, updates: Partial<Shape>) => Promise<void>,
      _userName: string = 'Unknown User',
      _userColor: string = '#DC2626'
    ): Promise<void> => {
      if (!userId) return;

      const beforeShape = shapes.find((s) => s.id === shapeId);
      if (!beforeShape) return;

      // Create operation for tracking
      const operation: Operation = {
        id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'move',
        userId,
        timestamp: Date.now(),
        before: { shapeData: beforeShape },
        after: { shapeData: { ...beforeShape, ...updates } },
        shapeIds: [shapeId],
      };

      // Track as pending
      pendingOperations.current.set(shapeId, operation);

      // Use rate limiter with debouncing (100ms as per task requirements)
      await moveRateLimiter.current.queueUpdate(shapeId, updates, async (data) => {
        try {
          await updateCallback(shapeId, data);
          
          // Confirmed - remove from pending
          pendingOperations.current.delete(shapeId);
        } catch (error) {
          console.error('Error updating shape:', error);
          pendingOperations.current.delete(shapeId);
          throw error;
        }
      });
    },
    [userId, shapes]
  );

  /**
   * Handle rapid edit storm conflicts (Task 13.5.8)
   * Detects multiple rapid edits (resize, color, move) on same shape
   */
  const handleRapidEditsWithConflictDetection = useCallback(
    async (
      shapeId: string,
      updates: Partial<Shape>,
      updateCallback: (id: string, updates: Partial<Shape>) => Promise<void>
    ): Promise<void> => {
      if (!userId) return;

      const beforeShape = shapes.find((s) => s.id === shapeId);
      if (!beforeShape) return;

      // Check if multiple users are editing
      const editingUser = shapesBeingEdited.current.get(shapeId);
      if (editingUser && editingUser.userId !== userId) {
        // Rapid edit storm detected
        if (enableVisualFeedback) {
          showToast(
            'Shape being edited by multiple users',
            'rapid_edit_storm',
            editingUser.userName
          );
        }
      }

      // Mark as being edited
      shapesBeingEdited.current.set(shapeId, {
        userId,
        userName: 'You',
      });

      // Clear after 1 second of inactivity
      setTimeout(() => {
        const current = shapesBeingEdited.current.get(shapeId);
        if (current && current.userId === userId) {
          shapesBeingEdited.current.delete(shapeId);
        }
      }, 1000);

      // Batch updates every 100ms
      updateBatcher.current.add(shapeId, updates, async (batch) => {
        // Merge all updates (last write wins for each property)
        const mergedUpdates = batch.reduce((acc, update) => ({ ...acc, ...update }), {});

        try {
          await updateRateLimiter.current.queueUpdate(
            shapeId,
            mergedUpdates,
            async (data) => {
              await updateCallback(shapeId, data);
            }
          );
        } catch (error) {
          console.error('Error in rapid edit handling:', error);
        }
      });
    },
    [userId, shapes, enableVisualFeedback, showToast]
  );

  /**
   * Handle delete vs edit conflicts (Task 13.5.9)
   * Detects when one user deletes while another is editing
   */
  const handleDeleteWithConflictDetection = useCallback(
    async (
      shapeId: string,
      deleteCallback: (id: string) => Promise<void>,
      _getUserName: (_userId: string) => string = () => 'Unknown User'
    ): Promise<boolean> => {
      if (!userId) return false;

      // Check if shape is being edited by someone else
      const editingUser = shapesBeingEdited.current.get(shapeId);
      
      if (editingUser && editingUser.userId !== userId) {
        // Confirmation dialog would go here
        // For now, we'll show a warning and allow delete
        if (enableVisualFeedback) {
          showToast(
            `Shape is being edited by ${editingUser.userName}`,
            'delete_while_editing',
            editingUser.userName
          );
        }

        // Small delay to show the warning
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Perform delete
      try {
        await deleteCallback(shapeId);
        shapesBeingEdited.current.delete(shapeId);
        return true;
      } catch (error) {
        console.error('Error deleting shape:', error);
        return false;
      }
    },
    [userId, enableVisualFeedback, showToast]
  );

  /**
   * Handle remote update (from Firestore subscription)
   * Detects if it conflicts with local pending operations
   */
  const handleRemoteUpdate = useCallback(
    (remoteShape: Shape, getUserName: (userId: string) => string, getUserColor: (userId: string) => string) => {
      if (!userId) return;

      const pendingOp = pendingOperations.current.get(remoteShape.id);
      
      if (pendingOp) {
        // Create remote operation
        const remoteOp: Operation = {
          id: `remote-${Date.now()}`,
          type: 'update',
          userId: remoteShape.lastModifiedBy || 'unknown',
          timestamp: remoteShape.lastModifiedTimestamp || Date.now(),
          before: { shapeData: pendingOp.before.shapeData },
          after: { shapeData: remoteShape },
          shapeIds: [remoteShape.id],
        };

        // Detect conflict
        const conflict = detectConflict(pendingOp, remoteOp);

        if (conflict.hasConflict && shouldNotifyUser(conflict)) {
          const remotUserName = getUserName(remoteOp.userId);
          const remoteUserColor = getUserColor(remoteOp.userId);
          const severity = getConflictSeverity(conflict);

          // Log conflict
          if (enableLogging) {
            logConflictResult(conflict, userId, remoteOp.userId, severity);
          }

          // Show visual feedback
          if (enableVisualFeedback && conflict.resolution === 'remote_wins') {
            showShapeIndicator(
              remoteShape.id,
              conflict.type,
              remotUserName,
              remoteUserColor
            );

            const message = getConflictMessage(conflict.type, remotUserName);
            showToast(message, conflict.type, remotUserName);
          }

          // Clear pending operation
          pendingOperations.current.delete(remoteShape.id);
        }
      }

      // Check for delete while editing
      const editingUser = shapesBeingEdited.current.get(remoteShape.id);
      if (editingUser && editingUser.userId === userId) {
        // This shape was being edited locally but doesn't exist anymore
        // It was likely deleted by another user
        if (enableVisualFeedback) {
          const remoteUserName = getUserName(remoteShape.lastModifiedBy || 'unknown');
          showToast(
            `Shape was deleted by ${remoteUserName}`,
            'delete_while_editing',
            remoteUserName
          );
        }
        shapesBeingEdited.current.delete(remoteShape.id);
      }
    },
    [userId, enableLogging, enableVisualFeedback, showShapeIndicator, showToast]
  );

  /**
   * Handle shape deleted remotely
   */
  const handleRemoteDelete = useCallback(
    (shapeId: string, deletedByUserId: string, getUserName: (userId: string) => string) => {
      if (!userId) return;

      // Check if we were editing this shape
      const editingUser = shapesBeingEdited.current.get(shapeId);
      if (editingUser && editingUser.userId === userId) {
        // We were editing but it was deleted
        if (enableVisualFeedback) {
          const remoteUserName = getUserName(deletedByUserId);
          showToast(
            `Shape was deleted by ${remoteUserName}`,
            'delete_while_editing',
            remoteUserName
          );
        }
        shapesBeingEdited.current.delete(shapeId);
      }

      // Clear any pending operations
      pendingOperations.current.delete(shapeId);
    },
    [userId, enableVisualFeedback, showToast]
  );

  /**
   * Get rate limiter stats for debugging
   */
  const getRateLimiterStats = useCallback(() => {
    return {
      move: moveRateLimiter.current.getStats(),
      update: updateRateLimiter.current.getStats(),
    };
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      moveRateLimiter.current.clearAllQueues();
      updateRateLimiter.current.clearAllQueues();
      pendingOperations.current.clear();
      shapesBeingEdited.current.clear();
    };
  }, []);

  return {
    // Conflict-aware operations
    handleMoveWithConflictDetection,
    handleRapidEditsWithConflictDetection,
    handleDeleteWithConflictDetection,
    handleRemoteUpdate,
    handleRemoteDelete,
    
    // Visual indicators
    shapeIndicators,
    toasts,
    removeToast,
    
    // Stats
    getRateLimiterStats,
    
    // Refs (for advanced usage)
    pendingOperations: pendingOperations.current,
    shapesBeingEdited: shapesBeingEdited.current,
  };
}

