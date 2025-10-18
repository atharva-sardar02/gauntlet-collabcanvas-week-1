import { createContext, useState, type ReactNode, useCallback, useRef } from 'react';
import Konva from 'konva';
import { useCanvas as useCanvasHook } from '../hooks/useCanvas';
import { useAuth } from '../hooks/useAuth';
import { DUPLICATE_OFFSET } from '../utils/constants';
import type { Operation } from '../types/operations';
import {
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterHorizontal,
  alignCenterVertical,
  distributeHorizontal,
  distributeVertical,
} from '../utils/alignment';
import {
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  getLayerPosition,
} from '../utils/layers';

/**
 * Generate a default name for a shape
 */
function generateShapeName(type: string, index: number): string {
  const typeName = type.charAt(0).toUpperCase() + type.slice(1);
  return `${typeName} ${index}`;
}

// Define the shape interface
export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'star' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  name?: string;                  // NEW: Editable shape name
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // 'normal' | 'italic' | 'bold' | 'bold italic'
  textDecoration?: string; // 'underline' | ''
  // Circle-specific (uses width as diameter)
  radius?: number;
  // Transform properties
  rotation?: number;              // Rotation in degrees
  scaleX?: number;                // Horizontal scale
  scaleY?: number;                // Vertical scale
  // Visual effects
  opacity?: number;               // Opacity 0-1 (default: 1)
  blendMode?: string;             // Konva globalCompositeOperation (default: 'source-over')
  // Metadata
  createdBy?: string;
  createdByName?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedByColor?: string | null;
  lockedByName?: string;
  // Conflict resolution metadata
  version?: number;              // Increments on each edit
  lastModifiedTimestamp?: number; // Firestore server timestamp (milliseconds)
  editSessionId?: string;         // Unique ID for current edit session
  // Layer management
  zIndex?: number;                // Layer order (higher = in front)
}

// Define the Canvas Context interface
export interface CanvasContextType {
  shapes: Shape[];
  selectedId: string | null;
  selectedIds: string[];
  stageRef: React.RefObject<Konva.Stage> | null;
  loading: boolean;
  error: string | null;
  addShape: (shape: Omit<Shape, 'id'>, skipHistory?: boolean) => Promise<void>;
  bulkAddShapes: (shapes: Array<Omit<Shape, 'id'>>) => Promise<void>;
  updateShape: (id: string, updates: Partial<Shape>, skipHistory?: boolean) => Promise<void>;
  updateShapeName: (id: string, newName: string) => Promise<void>;  // NEW: Rename shape
  deleteShape: (id: string, skipHistory?: boolean) => Promise<void>;
  selectShape: (id: string | null) => void;
  selectShapes: (ids: string[]) => void;
  toggleShapeSelection: (id: string) => void;
  setStageRef: (ref: React.RefObject<Konva.Stage>) => void;
  lockShape: (id: string, userColor: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  duplicateShape: (id: string, skipHistory?: boolean) => Promise<string | null>;
  nudgeShape: (id: string, direction: 'up' | 'down' | 'left' | 'right', amount: number, skipHistory?: boolean) => Promise<void>;
  setOperationCallback: (callback: ((operation: Operation) => void) | null) => void;
  recreateShape: (shape: Shape) => Promise<void>;
  alignShapes: (ids: string[], mode: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => Promise<void>;
  distributeShapes: (ids: string[], axis: 'horizontal' | 'vertical', align?: boolean) => Promise<void>;
  // Layer management
  bringShapeToFront: (id: string) => Promise<void>;
  sendShapeToBack: (id: string) => Promise<void>;
  bringShapeForward: (id: string) => Promise<void>;
  sendShapeBackward: (id: string) => Promise<void>;
  getShapeLayerInfo: (id: string) => { current: number; total: number };
  // Canvas management
  clearAllShapes: () => Promise<void>;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
    bulkAddShapes: bulkAddShapesToFirebase,
    updateShape: updateShapeInFirebase,
    deleteShape: deleteShapeFromFirebase,
    lockShape: lockShapeInFirebase,
    unlockShape: unlockShapeInFirebase,
    recreateShape: recreateShapeInFirebase,
    clearAllShapes: clearAllShapesInFirebase,
  } = useCanvasHook();

  /**
   * Add a new shape to the canvas
   * Server-authoritative: waits for Firebase confirmation
   */
  const addShape = useCallback(
    async (shape: Omit<Shape, 'id'>, skipHistory = false) => {
      // Auto-generate name if not provided
      const shapeWithName = {
        ...shape,
        name: shape.name || generateShapeName(shape.type, shapes.length + 1),
      };
      
      const shapeId = await addShapeToFirebase(shapeWithName);
      
      // Track operation for undo/redo
      if (!skipHistory && operationCallbackRef.current && shapeId && currentUser) {
        const fullShape: Shape = {
          ...shapeWithName,
          id: shapeId,
        } as Shape;
        
        operationCallbackRef.current({
          id: `op-${Date.now()}`,
          type: 'create',
          userId: currentUser.uid,
          timestamp: Date.now(),
          before: {},
          after: { shapeData: fullShape },
          shapeIds: [shapeId],
        });
      }
    },
    [addShapeToFirebase, currentUser, shapes.length]
  );

  /**
   * Bulk add multiple shapes to the canvas
   * Much more efficient than calling addShape multiple times
   * Used by AI agent for bulk operations (500+ shapes)
   */
  const bulkAddShapes = useCallback(
    async (shapesData: Array<Omit<Shape, 'id'>>) => {
      // Auto-generate names for shapes that don't have them
      const shapesWithNames = shapesData.map((shape, index) => ({
        ...shape,
        name: shape.name || generateShapeName(shape.type, shapes.length + index + 1),
      }));
      
      await bulkAddShapesToFirebase(shapesWithNames);
      // Note: Skipping undo/redo tracking for bulk operations
      // Too many operations would overwhelm the undo stack
    },
    [bulkAddShapesToFirebase, shapes.length]
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
   * Update shape name (convenience method)
   */
  const updateShapeName = useCallback(
    async (id: string, newName: string) => {
      await updateShape(id, { name: newName });
    },
    [updateShape]
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
   * Select or deselect a shape (single selection)
   */
  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id);
    setSelectedIds(id ? [id] : []);
  }, []);

  /**
   * Select multiple shapes
   */
  const selectShapes = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    setSelectedId(ids.length === 1 ? ids[0] : ids[0] || null);
  }, []);

  /**
   * Toggle shape selection (for multi-select with Shift key)
   */
  const toggleShapeSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const newIds = prev.filter(i => i !== id);
        setSelectedId(newIds.length === 1 ? newIds[0] : newIds[0] || null);
        return newIds;
      } else {
        const newIds = [...prev, id];
        setSelectedId(newIds.length === 1 ? newIds[0] : id);
        return newIds;
      }
    });
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

      // Clone the shape with ALL properties (including rotation, opacity, blend mode, etc.)
      // Filter out undefined values to avoid Firestore errors
      const duplicatedShape: Omit<Shape, 'id'> = {
        type: shape.type,
        x: shape.x + DUPLICATE_OFFSET,
        y: shape.y + DUPLICATE_OFFSET,
        width: shape.width,
        height: shape.height,
        fill: shape.fill,
        // Metadata
        createdAt: Date.now(),
      };

      // Only add optional properties if they exist
      if (shape.rotation !== undefined) duplicatedShape.rotation = shape.rotation;
      if (shape.scaleX !== undefined) duplicatedShape.scaleX = shape.scaleX;
      if (shape.scaleY !== undefined) duplicatedShape.scaleY = shape.scaleY;
      if (shape.opacity !== undefined) duplicatedShape.opacity = shape.opacity;
      if (shape.blendMode !== undefined) duplicatedShape.blendMode = shape.blendMode;
      
      // Text properties
      if (shape.text !== undefined) duplicatedShape.text = shape.text;
      if (shape.fontSize !== undefined) duplicatedShape.fontSize = shape.fontSize;
      if (shape.fontFamily !== undefined) duplicatedShape.fontFamily = shape.fontFamily;
      if (shape.fontStyle !== undefined) duplicatedShape.fontStyle = shape.fontStyle;
      if (shape.textDecoration !== undefined) duplicatedShape.textDecoration = shape.textDecoration;
      
      // Stroke
      if ((shape as any).stroke !== undefined) (duplicatedShape as any).stroke = (shape as any).stroke;

      // Create the duplicated shape and capture its ID
      const newShapeId = await addShapeToFirebase(duplicatedShape);
      
      // Track operation for history (store BOTH original and new shape IDs)
      if (!skipHistory && operationCallbackRef.current && currentUser && newShapeId) {
        operationCallbackRef.current({
          id: `op-${Date.now()}`,
          type: 'duplicate',
          userId: currentUser.uid,
          timestamp: Date.now(),
          before: { shapeData: shape },
          after: { shapeData: { ...duplicatedShape, id: newShapeId } as Shape },
          shapeIds: [id, newShapeId], // [0] = original, [1] = duplicate
        });
      }
      
      return newShapeId;
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
          updates = { y: shape.y - amount };
          break;
        case 'down':
          updates = { y: shape.y + amount };
          break;
        case 'left':
          updates = { x: shape.x - amount };
          break;
        case 'right':
          updates = { x: shape.x + amount };
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
   * @param shape - Complete shape data to recreate with original ID
   */
  const recreateShape = useCallback(
    async (shape: Shape) => {
      // Use the canvas service to recreate the shape with its original ID
      if (recreateShapeInFirebase) {
        await recreateShapeInFirebase(shape);
      }
    },
    [recreateShapeInFirebase]
  );

  /**
   * Align multiple shapes
   * @param ids - Array of shape IDs to align
   * @param mode - Alignment mode
   */
  const alignShapes = useCallback(
    async (ids: string[], mode: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
      if (ids.length < 2) return;

      // Get shapes to align
      const shapesToAlign = shapes.filter(s => ids.includes(s.id));
      if (shapesToAlign.length < 2) return;

      // Check if any shapes are locked
      const hasLockedShapes = shapesToAlign.some(s => s.isLocked);
      if (hasLockedShapes) {
        console.warn('Cannot align: some shapes are locked');
        return;
      }

      // Calculate alignment updates
      let updates: Map<string, any>;
      switch (mode) {
        case 'left':
          updates = alignLeft(shapesToAlign);
          break;
        case 'right':
          updates = alignRight(shapesToAlign);
          break;
        case 'top':
          updates = alignTop(shapesToAlign);
          break;
        case 'bottom':
          updates = alignBottom(shapesToAlign);
          break;
        case 'center-h':
          updates = alignCenterHorizontal(shapesToAlign);
          break;
        case 'center-v':
          updates = alignCenterVertical(shapesToAlign);
          break;
        default:
          return;
      }

      // Apply updates to all shapes
      for (const [shapeId, updateData] of updates.entries()) {
        await updateShapeInFirebase(shapeId, updateData);
      }
    },
    [shapes, updateShapeInFirebase]
  );

  /**
   * Distribute shapes evenly
   * @param ids - Array of shape IDs to distribute
   * @param axis - Distribution axis
   * @param align - If true, also aligns shapes perpendicularly (for straight rows/columns)
   */
  const distributeShapes = useCallback(
    async (ids: string[], axis: 'horizontal' | 'vertical', align: boolean = false) => {
      if (ids.length < 3) return; // Need at least 3 shapes to distribute

      // Get shapes to distribute
      const shapesToDistribute = shapes.filter(s => ids.includes(s.id));
      if (shapesToDistribute.length < 3) return;

      // Check if any shapes are locked
      const hasLockedShapes = shapesToDistribute.some(s => s.isLocked);
      if (hasLockedShapes) {
        console.warn('Cannot distribute: some shapes are locked');
        return;
      }

      // Calculate distribution updates
      const updates = axis === 'horizontal' 
        ? distributeHorizontal(shapesToDistribute, align)  // Pass align flag
        : distributeVertical(shapesToDistribute, align);   // Pass align flag

      // Apply updates to all shapes
      for (const [shapeId, updateData] of updates.entries()) {
        await updateShapeInFirebase(shapeId, updateData);
      }
    },
    [shapes, updateShapeInFirebase]
  );

  /**
   * Layer Management Methods
   */

  /**
   * Bring shape to front (highest zIndex)
   * @param id - ID of shape to bring to front
   */
  const bringShapeToFront = useCallback(
    async (id: string) => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;

      // Check if shape is locked
      if (shape.isLocked) {
        console.warn('Cannot reorder locked shape');
        return;
      }

      const oldZIndex = shape.zIndex || 0;
      const newZIndex = bringToFront(shapes, id);
      
      // Push operation to history
      if (operationCallbackRef.current) {
        operationCallbackRef.current({
          id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'reorder',
          userId: currentUser?.uid || '',
          timestamp: Date.now(),
          shapeIds: [id],
          before: { shapeData: { zIndex: oldZIndex } },
          after: { shapeData: { zIndex: newZIndex } },
          description: 'Brought shape to front',
        });
      }

      await updateShapeInFirebase(id, { zIndex: newZIndex });
    },
    [shapes, updateShapeInFirebase, currentUser]
  );

  /**
   * Send shape to back (lowest zIndex)
   * @param id - ID of shape to send to back
   */
  const sendShapeToBack = useCallback(
    async (id: string) => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;

      // Check if shape is locked
      if (shape.isLocked) {
        console.warn('Cannot reorder locked shape');
        return;
      }

      const oldZIndex = shape.zIndex || 0;
      const newZIndex = sendToBack(shapes, id);
      
      // Push operation to history
      if (operationCallbackRef.current) {
        operationCallbackRef.current({
          id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'reorder',
          userId: currentUser?.uid || '',
          timestamp: Date.now(),
          shapeIds: [id],
          before: { shapeData: { zIndex: oldZIndex } },
          after: { shapeData: { zIndex: newZIndex } },
          description: 'Sent shape to back',
        });
      }

      await updateShapeInFirebase(id, { zIndex: newZIndex });
    },
    [shapes, updateShapeInFirebase, currentUser]
  );

  /**
   * Bring shape forward one layer
   * @param id - ID of shape to bring forward
   */
  const bringShapeForward = useCallback(
    async (id: string) => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;

      // Check if shape is locked
      if (shape.isLocked) {
        console.warn('Cannot reorder locked shape');
        return;
      }

      const oldZIndex = shape.zIndex || 0;
      const newZIndex = bringForward(shapes, id);
      if (newZIndex === null) {
        // Already at front
        return;
      }
      
      // Push operation to history
      if (operationCallbackRef.current) {
        operationCallbackRef.current({
          id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'reorder',
          userId: currentUser?.uid || '',
          timestamp: Date.now(),
          shapeIds: [id],
          before: { shapeData: { zIndex: oldZIndex } },
          after: { shapeData: { zIndex: newZIndex } },
          description: 'Brought shape forward',
        });
      }

      await updateShapeInFirebase(id, { zIndex: newZIndex });
    },
    [shapes, updateShapeInFirebase, currentUser]
  );

  /**
   * Send shape backward one layer
   * @param id - ID of shape to send backward
   */
  const sendShapeBackward = useCallback(
    async (id: string) => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;

      // Check if shape is locked
      if (shape.isLocked) {
        console.warn('Cannot reorder locked shape');
        return;
      }

      const oldZIndex = shape.zIndex || 0;
      const newZIndex = sendBackward(shapes, id);
      if (newZIndex === null) {
        // Already at back
        return;
      }
      
      // Push operation to history
      if (operationCallbackRef.current) {
        operationCallbackRef.current({
          id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'reorder',
          userId: currentUser?.uid || '',
          timestamp: Date.now(),
          shapeIds: [id],
          before: { shapeData: { zIndex: oldZIndex } },
          after: { shapeData: { zIndex: newZIndex } },
          description: 'Sent shape backward',
        });
      }

      await updateShapeInFirebase(id, { zIndex: newZIndex });
    },
    [shapes, updateShapeInFirebase, currentUser]
  );

  /**
   * Get layer position info for a shape
   * @param id - ID of shape
   * @returns Object with current position and total layers
   */
  const getShapeLayerInfo = useCallback(
    (id: string) => {
      return getLayerPosition(shapes, id);
    },
    [shapes]
  );

  /**
   * Clear all shapes from canvas
   */
  const clearAllShapes = useCallback(async () => {
    await clearAllShapesInFirebase();
    
    // Clear selection
    setSelectedId(null);
    setSelectedIds([]);
  }, [clearAllShapesInFirebase]);

  const value: CanvasContextType = {
    shapes,
    selectedId,
    selectedIds,
    stageRef,
    loading,
    error,
    addShape,
    bulkAddShapes,
    updateShape,
    updateShapeName,  // NEW: Add to context
    deleteShape,
    selectShape,
    selectShapes,
    toggleShapeSelection,
    setStageRef,
    lockShape,
    unlockShape,
    duplicateShape,
    nudgeShape,
    setOperationCallback: useCallback((callback) => {
      operationCallbackRef.current = callback;
    }, []),
    recreateShape,
    alignShapes,
    distributeShapes,
    // Layer management
    bringShapeToFront,
    sendShapeToBack,
    bringShapeForward,
    sendShapeBackward,
    getShapeLayerInfo,
    // Canvas management
    clearAllShapes,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasContext;
