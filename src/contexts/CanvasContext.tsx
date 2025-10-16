import { createContext, useState, type ReactNode, useCallback, useRef } from 'react';
import Konva from 'konva';
import { useCanvas as useCanvasHook } from '../hooks/useCanvas';
import { useAuth } from '../hooks/useAuth';
import { DUPLICATE_OFFSET, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import type { Operation } from '../types/operations';

// Define the shape interface
export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // 'normal' | 'italic' | 'bold' | 'bold italic'
  textDecoration?: string; // 'underline' | ''
  // Circle-specific (uses width as diameter)
  radius?: number;
  // Metadata
  createdBy?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedByColor?: string | null;
  lockedByName?: string;
  // Conflict resolution metadata
  version?: number;              // Increments on each edit
  lastModifiedTimestamp?: number; // Firestore server timestamp (milliseconds)
  editSessionId?: string;         // Unique ID for current edit session
}

// Define the Canvas Context interface
export interface CanvasContextType {
  shapes: Shape[];
  selectedId: string | null;
  stageRef: React.RefObject<Konva.Stage> | null;
  loading: boolean;
  error: string | null;
  addShape: (shape: Omit<Shape, 'id'>, skipHistory?: boolean) => Promise<void>;
  updateShape: (id: string, updates: Partial<Shape>, skipHistory?: boolean) => Promise<void>;
  deleteShape: (id: string, skipHistory?: boolean) => Promise<void>;
  selectShape: (id: string | null) => void;
  setStageRef: (ref: React.RefObject<Konva.Stage>) => void;
  lockShape: (id: string, userColor: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  duplicateShape: (id: string, skipHistory?: boolean) => Promise<string | null>;
  nudgeShape: (id: string, direction: 'up' | 'down' | 'left' | 'right', amount: number, skipHistory?: boolean) => Promise<void>;
  setOperationCallback: (callback: ((operation: Operation) => void) | null) => void;
  recreateShape: (shape: Shape) => Promise<void>;
}

// Create the context
const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

// Props for CanvasProvider
interface CanvasProviderProps {
  children: ReactNode;
}

/**
 * Canvas Provider Component
 * Manages canvas state with real-time Firebase synchronization
 */
export const CanvasProvider = ({ children }: CanvasProviderProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageRef, setStageRefState] = useState<React.RefObject<Konva.Stage> | null>(null);
  const operationCallbackRef = useRef<((operation: Operation) => void) | null>(null);
  
  // Get current user for tracking operations
  const { currentUser } = useAuth();

  // Use the canvas hook for real-time sync
  const {
    shapes,
    loading,
    error,
    addShape: addShapeToFirebase,
    updateShape: updateShapeInFirebase,
    deleteShape: deleteShapeFromFirebase,
    lockShape: lockShapeInFirebase,
    unlockShape: unlockShapeInFirebase,
  } = useCanvasHook();

  /**
   * Add a new shape to the canvas
   * Server-authoritative: waits for Firebase confirmation
   */
  const addShape = useCallback(
    async (shape: Omit<Shape, 'id'>, skipHistory = false) => {
      await addShapeToFirebase(shape);
      
      // Track operation for undo/redo (will be called after shape is created)
      // Note: For create operations, we track them via the shapes subscription
      // since we need the actual Firebase-generated ID
    },
    [addShapeToFirebase]
  );

  /**
   * Update an existing shape
   * Server-authoritative: waits for Firebase confirmation
   */
  const updateShape = useCallback(
    async (id: string, updates: Partial<Shape>, skipHistory = false) => {
      const beforeShape = shapes.find(s => s.id === id);
      await updateShapeInFirebase(id, updates);
      
      // Track operation for history
      if (!skipHistory && operationCallbackRef.current && beforeShape && currentUser) {
        const afterShape = { ...beforeShape, ...updates };
        operationCallbackRef.current({
          id: `op-${Date.now()}`,
          type: 'update',
          userId: currentUser.uid,
          timestamp: Date.now(),
          before: { shapeData: beforeShape },
          after: { shapeData: afterShape },
          shapeIds: [id],
        });
      }
    },
    [updateShapeInFirebase, shapes, currentUser]
  );

  /**
   * Delete a shape from the canvas
   * Server-authoritative: waits for Firebase confirmation
   */
  const deleteShape = useCallback(
    async (id: string, skipHistory = false) => {
      const beforeShape = shapes.find(s => s.id === id);
      await deleteShapeFromFirebase(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      
      // Track operation for history
      if (!skipHistory && operationCallbackRef.current && beforeShape && currentUser) {
        operationCallbackRef.current({
          id: `op-${Date.now()}`,
          type: 'delete',
          userId: currentUser.uid,
          timestamp: Date.now(),
          before: { shapeData: beforeShape },
          after: {},
          shapeIds: [id],
        });
      }
    },
    [deleteShapeFromFirebase, selectedId, shapes, currentUser]
  );

  /**
   * Select or deselect a shape
   */
  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  /**
   * Set the stage reference
   */
  const setStageRef = useCallback((ref: React.RefObject<Konva.Stage>) => {
    setStageRefState(ref);
  }, []);

  /**
   * Lock a shape for editing
   */
  const lockShape = useCallback(
    async (id: string, userColor: string) => {
      await lockShapeInFirebase(id, userColor);
    },
    [lockShapeInFirebase]
  );

  /**
   * Unlock a shape
   */
  const unlockShape = useCallback(
    async (id: string) => {
      await unlockShapeInFirebase(id);
    },
    [unlockShapeInFirebase]
  );

  /**
   * Duplicate a shape
   * Creates a deep clone with a new ID and offset position
   * @param id - ID of shape to duplicate
   * @returns ID of the new duplicated shape, or null if not found
   */
  const duplicateShape = useCallback(
    async (id: string, skipHistory = false): Promise<string | null> => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return null;

      // Clone the shape with a new ID and offset position
      const duplicatedShape: Omit<Shape, 'id'> = {
        type: shape.type,
        x: Math.min(shape.x + DUPLICATE_OFFSET, CANVAS_WIDTH - shape.width),
        y: Math.min(shape.y + DUPLICATE_OFFSET, CANVAS_HEIGHT - shape.height),
        width: shape.width,
        height: shape.height,
        fill: shape.fill,
        createdAt: Date.now(),
      };

      await addShapeToFirebase(duplicatedShape);
      
      // Track operation for history
      if (!skipHistory && operationCallbackRef.current && currentUser) {
        operationCallbackRef.current({
          id: `op-${Date.now()}`,
          type: 'duplicate',
          userId: currentUser.uid,
          timestamp: Date.now(),
          before: { shapeData: shape },
          after: { shapeData: duplicatedShape as Shape },
          shapeIds: [id],
        });
      }
      
      // Return a generated ID (in practice, this would come from Firebase)
      // For now, we'll return a placeholder that the caller can use
      return `shape-${Date.now()}-duplicated`;
    },
    [shapes, addShapeToFirebase, currentUser]
  );

  /**
   * Nudge a shape by a specified amount in a direction
   * @param id - ID of shape to nudge
   * @param direction - Direction to nudge ('up', 'down', 'left', 'right')
   * @param amount - Amount to nudge in pixels
   */
  const nudgeShape = useCallback(
    async (id: string, direction: 'up' | 'down' | 'left' | 'right', amount: number, skipHistory = false) => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;

      let updates: Partial<Shape> = {};

      switch (direction) {
        case 'up':
          updates = { y: Math.max(0, shape.y - amount) };
          break;
        case 'down':
          updates = { y: Math.min(CANVAS_HEIGHT - shape.height, shape.y + amount) };
          break;
        case 'left':
          updates = { x: Math.max(0, shape.x - amount) };
          break;
        case 'right':
          updates = { x: Math.min(CANVAS_WIDTH - shape.width, shape.x + amount) };
          break;
      }

      await updateShapeInFirebase(id, updates);
      
      // Track operation for history
      if (!skipHistory && operationCallbackRef.current && currentUser) {
        operationCallbackRef.current({
          id: `op-${Date.now()}`,
          type: 'move',
          userId: currentUser.uid,
          timestamp: Date.now(),
          before: { shapeData: shape },
          after: { shapeData: { ...shape, ...updates } },
          shapeIds: [id],
        });
      }
    },
    [shapes, updateShapeInFirebase, currentUser]
  );

  /**
   * Recreate a shape (for undo of delete operations)
   * @param shape - Complete shape data to recreate
   */
  const recreateShape = useCallback(
    async (shape: Shape) => {
      // Use the canvas service to recreate the shape with its original ID
      await addShapeToFirebase(shape);
    },
    [addShapeToFirebase]
  );

  const value: CanvasContextType = {
    shapes,
    selectedId,
    stageRef,
    loading,
    error,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    setStageRef,
    lockShape,
    unlockShape,
    duplicateShape,
    nudgeShape,
    setOperationCallback: useCallback((callback) => {
      operationCallbackRef.current = callback;
    }, []),
    recreateShape,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasContext;
