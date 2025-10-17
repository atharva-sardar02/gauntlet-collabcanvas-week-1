import type { Shape } from '../contexts/CanvasContext';

/**
 * Layer Management Utilities
 * Functions to manage z-index ordering of shapes on the canvas
 */

/**
 * Bring a shape to the front (highest zIndex)
 * @param shapes - All shapes on the canvas
 * @param shapeId - ID of shape to bring to front
 * @returns New zIndex value for the shape
 */
export const bringToFront = (shapes: Shape[], _shapeId: string): number => {
  if (shapes.length === 0) return 1;
  
  // Find the highest zIndex
  const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
  
  // Set shape to maxZIndex + 1
  return maxZIndex + 1;
};

/**
 * Send a shape to the back (lowest zIndex)
 * @param shapes - All shapes on the canvas
 * @param shapeId - ID of shape to send to back
 * @returns New zIndex value for the shape
 */
export const sendToBack = (shapes: Shape[], _shapeId: string): number => {
  if (shapes.length === 0) return 1;
  
  // Find the lowest zIndex
  const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);
  
  // Set shape to minZIndex - 1
  return minZIndex - 1;
};

/**
 * Bring a shape forward one layer
 * Swaps zIndex with the shape immediately above it
 * @param shapes - All shapes on the canvas
 * @param shapeId - ID of shape to bring forward
 * @returns New zIndex value for the shape, or null if already at front
 */
export const bringForward = (shapes: Shape[], shapeId: string): number | null => {
  const currentShape = shapes.find(s => s.id === shapeId);
  if (!currentShape) return null;
  
  const currentZIndex = currentShape.zIndex || 0;
  
  // Find the shape immediately above (next higher zIndex)
  const shapesAbove = shapes
    .filter(s => (s.zIndex || 0) > currentZIndex)
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  
  if (shapesAbove.length === 0) {
    // Already at front
    return null;
  }
  
  // Swap with the shape immediately above
  const shapeAbove = shapesAbove[0];
  const newZIndex = shapeAbove.zIndex || 0;
  
  return newZIndex + 0.5; // Place between current and next
};

/**
 * Send a shape backward one layer
 * Swaps zIndex with the shape immediately below it
 * @param shapes - All shapes on the canvas
 * @param shapeId - ID of shape to send backward
 * @returns New zIndex value for the shape, or null if already at back
 */
export const sendBackward = (shapes: Shape[], shapeId: string): number | null => {
  const currentShape = shapes.find(s => s.id === shapeId);
  if (!currentShape) return null;
  
  const currentZIndex = currentShape.zIndex || 0;
  
  // Find the shape immediately below (next lower zIndex)
  const shapesBelow = shapes
    .filter(s => (s.zIndex || 0) < currentZIndex)
    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  
  if (shapesBelow.length === 0) {
    // Already at back
    return null;
  }
  
  // Swap with the shape immediately below
  const shapeBelow = shapesBelow[0];
  const newZIndex = shapeBelow.zIndex || 0;
  
  return newZIndex - 0.5; // Place between current and previous
};

/**
 * Get the layer position of a shape
 * @param shapes - All shapes on the canvas
 * @param shapeId - ID of shape to get position for
 * @returns Object with current position and total layers
 */
export const getLayerPosition = (
  shapes: Shape[],
  shapeId: string
): { current: number; total: number } => {
  const currentShape = shapes.find(s => s.id === shapeId);
  if (!currentShape) {
    return { current: 0, total: shapes.length };
  }
  
  // Sort shapes by zIndex to find position
  const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  
  // Find the position (1-indexed)
  const position = sortedShapes.findIndex(s => s.id === shapeId) + 1;
  
  return {
    current: position,
    total: shapes.length,
  };
};

/**
 * Normalize zIndices to remove gaps
 * Reassigns zIndex values to be consecutive integers starting from 1
 * Useful for cleaning up after many layer operations
 * @param shapes - All shapes on the canvas
 * @returns Updated shapes with normalized zIndex values
 */
export const normalizeZIndices = (shapes: Shape[]): Shape[] => {
  // Sort shapes by current zIndex
  const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  
  // Reassign zIndex as consecutive integers
  return sortedShapes.map((shape, index) => ({
    ...shape,
    zIndex: index + 1,
  }));
};

/**
 * Check if a shape is at the front
 * @param shapes - All shapes on the canvas
 * @param shapeId - ID of shape to check
 * @returns True if shape is at front
 */
export const isAtFront = (shapes: Shape[], shapeId: string): boolean => {
  const currentShape = shapes.find(s => s.id === shapeId);
  if (!currentShape) return false;
  
  const currentZIndex = currentShape.zIndex || 0;
  const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
  
  return currentZIndex === maxZIndex;
};

/**
 * Check if a shape is at the back
 * @param shapes - All shapes on the canvas
 * @param shapeId - ID of shape to check
 * @returns True if shape is at back
 */
export const isAtBack = (shapes: Shape[], shapeId: string): boolean => {
  const currentShape = shapes.find(s => s.id === shapeId);
  if (!currentShape) return false;
  
  const currentZIndex = currentShape.zIndex || 0;
  const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);
  
  return currentZIndex === minZIndex;
};

