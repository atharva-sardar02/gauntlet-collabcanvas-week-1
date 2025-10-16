import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Operation } from '../types/operations';
import { getOperationDescription } from '../types/operations';

/**
 * Maximum number of operations to store in history
 */
const MAX_HISTORY_SIZE = 50;

/**
 * Local storage key for persisting history
 */
const HISTORY_STORAGE_KEY = 'collabcanvas-history';

export interface HistoryContextType {
  undoStack: Operation[];
  redoStack: Operation[];
  canUndo: boolean;
  canRedo: boolean;
  pushOperation: (operation: Operation) => void;
  undo: () => Operation | null;
  redo: () => Operation | null;
  clearHistory: () => void;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

interface HistoryProviderProps {
  children: ReactNode;
  userId: string | null;
}

/**
 * History Provider Component
 * Manages undo/redo stacks for user-scoped operations
 */
export const HistoryProvider = ({ children, userId }: HistoryProviderProps) => {
  const [undoStack, setUndoStack] = useState<Operation[]>([]);
  const [redoStack, setRedoStack] = useState<Operation[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    if (!userId) return;

    try {
      const stored = localStorage.getItem(`${HISTORY_STORAGE_KEY}-${userId}`);
      if (stored) {
        const { undoStack: savedUndo } = JSON.parse(stored);
        // Only load recent operations (within last hour)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const recentOps = savedUndo.filter((op: Operation) => op.timestamp > oneHourAgo);
        setUndoStack(recentOps.slice(-MAX_HISTORY_SIZE));
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
  }, [userId]);

  // Save history to localStorage on changes
  useEffect(() => {
    if (!userId || undoStack.length === 0) return;

    try {
      const toSave = {
        undoStack: undoStack.slice(-MAX_HISTORY_SIZE),
        timestamp: Date.now(),
      };
      localStorage.setItem(`${HISTORY_STORAGE_KEY}-${userId}`, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  }, [undoStack, userId]);

  /**
   * Check if user can undo
   */
  const canUndo = undoStack.length > 0 && userId !== null;

  /**
   * Check if user can redo
   */
  const canRedo = redoStack.length > 0 && userId !== null;

  /**
   * Push a new operation to the undo stack
   * Clears redo stack when new operation is added
   */
  const pushOperation = useCallback((operation: Operation) => {
    setUndoStack((prev) => {
      const newStack = [...prev, operation];
      // Keep only last MAX_HISTORY_SIZE operations
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(-MAX_HISTORY_SIZE);
      }
      return newStack;
    });
    
    // Clear redo stack when new operation is performed
    setRedoStack([]);
  }, []);

  /**
   * Undo the last operation
   * Only undoes operations by the current user
   */
  const undo = useCallback((): Operation | null => {
    if (!canUndo || !userId) return null;

    // Find the last operation by this user
    const lastUserOpIndex = undoStack.length - 1;
    for (let i = lastUserOpIndex; i >= 0; i--) {
      if (undoStack[i].userId === userId) {
        const operation = undoStack[i];
        
        // Move operation from undo to redo stack
        setUndoStack((prev) => prev.slice(0, i).concat(prev.slice(i + 1)));
        setRedoStack((prev) => [...prev, operation]);
        
        return operation;
      }
    }

    return null;
  }, [undoStack, canUndo, userId]);

  /**
   * Redo the last undone operation
   * Only redoes operations by the current user
   */
  const redo = useCallback((): Operation | null => {
    if (!canRedo || !userId) return null;

    // Get the last operation from redo stack
    const lastRedoOpIndex = redoStack.length - 1;
    if (lastRedoOpIndex < 0) return null;

    const operation = redoStack[lastRedoOpIndex];
    
    // Only redo if it's this user's operation
    if (operation.userId !== userId) return null;

    // Move operation from redo to undo stack
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, operation]);

    return operation;
  }, [redoStack, canRedo, userId]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    
    if (userId) {
      try {
        localStorage.removeItem(`${HISTORY_STORAGE_KEY}-${userId}`);
      } catch (error) {
        console.error('Failed to clear history from localStorage:', error);
      }
    }
  }, [userId]);

  /**
   * Get description of next undo operation
   */
  const getUndoDescription = useCallback((): string | null => {
    if (!canUndo || !userId) return null;
    
    // Find last operation by this user
    for (let i = undoStack.length - 1; i >= 0; i--) {
      if (undoStack[i].userId === userId) {
        return getOperationDescription(undoStack[i]);
      }
    }
    
    return null;
  }, [undoStack, canUndo, userId]);

  /**
   * Get description of next redo operation
   */
  const getRedoDescription = useCallback((): string | null => {
    if (!canRedo) return null;
    
    const lastOp = redoStack[redoStack.length - 1];
    if (lastOp && lastOp.userId === userId) {
      return getOperationDescription(lastOp);
    }
    
    return null;
  }, [redoStack, canRedo, userId]);

  const value: HistoryContextType = {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    pushOperation,
    undo,
    redo,
    clearHistory,
    getUndoDescription,
    getRedoDescription,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

export default HistoryContext;

