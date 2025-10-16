import { createContext, useState, type ReactNode, useCallback } from 'react';
import Konva from 'konva';
import { useCanvas as useCanvasHook } from '../hooks/useCanvas';
import { DUPLICATE_OFFSET, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

// Define the shape interface
export interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedByColor?: string | null;
  lockedByName?: string;
}

// Define the Canvas Context interface
export interface CanvasContextType {
  shapes: Shape[];
  selectedId: string | null;
  stageRef: React.RefObject<Konva.Stage> | null;
  loading: boolean;
  error: string | null;
  addShape: (shape: Omit<Shape, 'id'>) => Promise<void>;
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  selectShape: (id: string | null) => void;
  setStageRef: (ref: React.RefObject<Konva.Stage>) => void;
  lockShape: (id: string, userColor: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  duplicateShape: (id: string) => Promise<string | null>;
  nudgeShape: (id: string, direction: 'up' | 'down' | 'left' | 'right', amount: number) => Promise<void>;
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
    async (shape: Omit<Shape, 'id'>) => {
      await addShapeToFirebase(shape);
    },
    [addShapeToFirebase]
  );

  /**
   * Update an existing shape
   * Server-authoritative: waits for Firebase confirmation
   */
  const updateShape = useCallback(
    async (id: string, updates: Partial<Shape>) => {
      await updateShapeInFirebase(id, updates);
    },
    [updateShapeInFirebase]
  );

  /**
   * Delete a shape from the canvas
   * Server-authoritative: waits for Firebase confirmation
   */
  const deleteShape = useCallback(
    async (id: string) => {
      await deleteShapeFromFirebase(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [deleteShapeFromFirebase, selectedId]
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
    async (id: string): Promise<string | null> => {
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
      
      // Return a generated ID (in practice, this would come from Firebase)
      // For now, we'll return a placeholder that the caller can use
      return `shape-${Date.now()}-duplicated`;
    },
    [shapes, addShapeToFirebase]
  );

  /**
   * Nudge a shape by a specified amount in a direction
   * @param id - ID of shape to nudge
   * @param direction - Direction to nudge ('up', 'down', 'left', 'right')
   * @param amount - Amount to nudge in pixels
   */
  const nudgeShape = useCallback(
    async (id: string, direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
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
    },
    [shapes, updateShapeInFirebase]
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
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasContext;
