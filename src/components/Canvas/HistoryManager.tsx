import { useEffect, useContext, useCallback } from 'react';
import { useHistory } from '../../hooks/useHistory';
import { useAuth } from '../../hooks/useAuth';
import CanvasContext from '../../contexts/CanvasContext';
import type { Operation } from '../../types/operations';

/**
 * History Manager Component
 * Connects history tracking with canvas operations
 * Handles undo/redo logic for all operation types
 */
const HistoryManager = () => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const canvasContext = useContext(CanvasContext);

  if (!canvasContext) {
    throw new Error('HistoryManager must be used within CanvasProvider');
  }

  const { 
    shapes, 
    updateShape, 
    deleteShape, 
    recreateShape,
    setOperationCallback 
  } = canvasContext;

  /**
   * Handle undo operation
   * Reverses the operation based on its type
   */
  const performUndo = useCallback(async (operation: Operation) => {
    if (!currentUser || operation.userId !== currentUser.uid) {
      console.warn('Cannot undo operation from another user');
      return false;
    }

    try {
      switch (operation.type) {
        case 'create':
          // Undo create by deleting the shape
          if (operation.shapeIds[0]) {
            await deleteShape(operation.shapeIds[0], true); // skipHistory = true
          }
          break;

        case 'delete':
          // Undo delete by recreating the shape
          if (operation.before.shapeData) {
            await recreateShape(operation.before.shapeData as any);
          }
          break;

        case 'move':
        case 'update':
        case 'transform':
        case 'resize':
          // Undo move/update/transform/resize by restoring previous state
          if (operation.before.shapeData && operation.shapeIds[0]) {
            const beforeData = operation.before.shapeData;
            const shape = shapes.find(s => s.id === operation.shapeIds[0]);
            
            if (!shape) {
              console.warn('Shape not found for undo:', operation.shapeIds[0]);
              return false;
            }

            // Check if shape was modified by another user since this operation
            if (shape.lastModifiedBy && shape.lastModifiedBy !== currentUser.uid) {
              console.warn('Cannot undo: shape modified by another user');
              return false;
            }

            await updateShape(operation.shapeIds[0], beforeData, true); // skipHistory = true
          }
          break;

        case 'duplicate':
          // Undo duplicate by deleting the duplicated shape
          // Note: We'd need to track the new shape ID for this to work properly
          // For now, this is a simplified implementation
          console.warn('Undo duplicate not fully implemented yet');
          break;

        default:
          console.warn('Unknown operation type for undo:', operation.type);
          return false;
      }

      return true;
    } catch (error) {
      console.error('Error performing undo:', error);
      return false;
    }
  }, [currentUser, shapes, updateShape, deleteShape, recreateShape]);

  /**
   * Handle redo operation
   * Re-applies the operation based on its type
   */
  const performRedo = useCallback(async (operation: Operation) => {
    if (!currentUser || operation.userId !== currentUser.uid) {
      console.warn('Cannot redo operation from another user');
      return false;
    }

    try {
      switch (operation.type) {
        case 'create':
          // Redo create by recreating the shape
          if (operation.after.shapeData) {
            await recreateShape(operation.after.shapeData as any);
          }
          break;

        case 'delete':
          // Redo delete by deleting the shape again
          if (operation.shapeIds[0]) {
            await deleteShape(operation.shapeIds[0], true); // skipHistory = true
          }
          break;

        case 'move':
        case 'update':
        case 'transform':
        case 'resize':
          // Redo move/update/transform/resize by applying the after state
          if (operation.after.shapeData && operation.shapeIds[0]) {
            const shape = shapes.find(s => s.id === operation.shapeIds[0]);
            
            if (!shape) {
              console.warn('Shape not found for redo:', operation.shapeIds[0]);
              return false;
            }

            // Check if shape was modified by another user
            if (shape.lastModifiedBy && shape.lastModifiedBy !== currentUser.uid) {
              console.warn('Cannot redo: shape modified by another user');
              return false;
            }

            await updateShape(operation.shapeIds[0], operation.after.shapeData, true); // skipHistory = true
          }
          break;

        case 'duplicate':
          // Redo duplicate by creating the duplicate again
          console.warn('Redo duplicate not fully implemented yet');
          break;

        default:
          console.warn('Unknown operation type for redo:', operation.type);
          return false;
      }

      return true;
    } catch (error) {
      console.error('Error performing redo:', error);
      return false;
    }
  }, [currentUser, shapes, updateShape, deleteShape, recreateShape]);

  // Set up operation callback to track operations
  useEffect(() => {
    if (currentUser) {
      setOperationCallback((operation: Operation) => {
        // Only track operations by current user
        if (operation.userId === currentUser.uid) {
          history.pushOperation(operation);
        }
      });
    }

    return () => {
      setOperationCallback(null);
    };
  }, [currentUser, history, setOperationCallback]);

  // Expose undo/redo functions globally (can be called from keyboard shortcuts)
  useEffect(() => {
    (window as any).__historyManager = {
      undo: async () => {
        const operation = history.undo();
        if (operation) {
          const success = await performUndo(operation);
          if (!success) {
            // If undo failed, push operation back
            history.pushOperation(operation);
          }
          return success;
        }
        return false;
      },
      redo: async () => {
        const operation = history.redo();
        if (operation) {
          const success = await performRedo(operation);
          if (!success) {
            // If redo failed, we can't easily recover
            console.warn('Redo operation failed');
          }
          return success;
        }
        return false;
      },
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      getUndoDescription: history.getUndoDescription,
      getRedoDescription: history.getRedoDescription,
    };

    return () => {
      delete (window as any).__historyManager;
    };
  }, [history, performUndo, performRedo]);

  // This component doesn't render anything
  return null;
};

export default HistoryManager;

