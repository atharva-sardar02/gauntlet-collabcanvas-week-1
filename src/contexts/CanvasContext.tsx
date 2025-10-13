import { createContext, useState, useRef, ReactNode } from 'react';
import Konva from 'konva';

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
  lockedBy?: string;
  lockedByColor?: string;
}

// Define the Canvas Context interface
export interface CanvasContextType {
  shapes: Shape[];
  selectedId: string | null;
  stageRef: React.RefObject<Konva.Stage> | null;
  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  setStageRef: (ref: React.RefObject<Konva.Stage>) => void;
}

// Create the context
const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

// Props for CanvasProvider
interface CanvasProviderProps {
  children: ReactNode;
}

/**
 * Canvas Provider Component
 * Manages canvas state including shapes, selection, and stage reference
 */
export const CanvasProvider = ({ children }: CanvasProviderProps) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageRef, setStageRefState] = useState<React.RefObject<Konva.Stage> | null>(null);

  /**
   * Add a new shape to the canvas
   * Generates a unique ID for the shape
   */
  const addShape = (shape: Omit<Shape, 'id'>) => {
    const newShape: Shape = {
      ...shape,
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setShapes((prev) => [...prev, newShape]);
  };

  /**
   * Update an existing shape
   * @param id - Shape ID to update
   * @param updates - Partial shape object with updates
   */
  const updateShape = (id: string, updates: Partial<Shape>) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id
          ? { ...shape, ...updates, lastModifiedAt: Date.now() }
          : shape
      )
    );
  };

  /**
   * Delete a shape from the canvas
   * @param id - Shape ID to delete
   */
  const deleteShape = (id: string) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  /**
   * Select or deselect a shape
   * @param id - Shape ID to select, or null to deselect
   */
  const selectShape = (id: string | null) => {
    setSelectedId(id);
  };

  /**
   * Set the stage reference
   * @param ref - Reference to the Konva Stage
   */
  const setStageRef = (ref: React.RefObject<Konva.Stage>) => {
    setStageRefState(ref);
  };

  const value: CanvasContextType = {
    shapes,
    selectedId,
    stageRef,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    setStageRef,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasContext;

