import type { Shape } from '../contexts/CanvasContext';

/**
 * Alignment utility functions for shapes
 * All functions return updated shape positions
 */

/**
 * Get the bounding box of multiple shapes
 * Note: shape.x and shape.y are the TOP-LEFT corner (Konva default for Rect, Line, Text)
 */
export const getBoundingBox = (shapes: Shape[]) => {
  if (shapes.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, centerX: 0, centerY: 0 };
  }

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  shapes.forEach((shape) => {
    // x, y is top-left corner for most Konva shapes
    left = Math.min(left, shape.x);
    right = Math.max(right, shape.x + shape.width);
    top = Math.min(top, shape.y);
    bottom = Math.max(bottom, shape.y + shape.height);
  });

  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
};

/**
 * Align shapes to the left edge
 * x is top-left corner
 */
export const alignLeft = (shapes: Shape[]): Map<string, { x: number }> => {
  if (shapes.length === 0) return new Map();

  const bounds = getBoundingBox(shapes);
  const updates = new Map<string, { x: number }>();

  shapes.forEach((shape) => {
    updates.set(shape.id, { x: bounds.left });
  });

  return updates;
};

/**
 * Align shapes to the right edge
 * x is top-left corner
 */
export const alignRight = (shapes: Shape[]): Map<string, { x: number }> => {
  if (shapes.length === 0) return new Map();

  const bounds = getBoundingBox(shapes);
  const updates = new Map<string, { x: number }>();

  shapes.forEach((shape) => {
    updates.set(shape.id, { x: bounds.right - shape.width });
  });

  return updates;
};

/**
 * Align shapes to the top edge
 * y is top-left corner
 */
export const alignTop = (shapes: Shape[]): Map<string, { y: number }> => {
  if (shapes.length === 0) return new Map();

  const bounds = getBoundingBox(shapes);
  const updates = new Map<string, { y: number }>();

  shapes.forEach((shape) => {
    updates.set(shape.id, { y: bounds.top });
  });

  return updates;
};

/**
 * Align shapes to the bottom edge
 * y is top-left corner
 */
export const alignBottom = (shapes: Shape[]): Map<string, { y: number }> => {
  if (shapes.length === 0) return new Map();

  const bounds = getBoundingBox(shapes);
  const updates = new Map<string, { y: number }>();

  shapes.forEach((shape) => {
    updates.set(shape.id, { y: bounds.bottom - shape.height });
  });

  return updates;
};

/**
 * Align shapes to center horizontally
 */
export const alignCenterHorizontal = (shapes: Shape[]): Map<string, { x: number }> => {
  if (shapes.length === 0) return new Map();

  const bounds = getBoundingBox(shapes);
  const updates = new Map<string, { x: number }>();

  shapes.forEach((shape) => {
    updates.set(shape.id, { x: bounds.centerX - shape.width / 2 });
  });

  return updates;
};

/**
 * Align shapes to center vertically
 */
export const alignCenterVertical = (shapes: Shape[]): Map<string, { y: number }> => {
  if (shapes.length === 0) return new Map();

  const bounds = getBoundingBox(shapes);
  const updates = new Map<string, { y: number }>();

  shapes.forEach((shape) => {
    updates.set(shape.id, { y: bounds.centerY - shape.height / 2 });
  });

  return updates;
};

/**
 * Distribute shapes horizontally with fixed 100px gap between edges
 * Gap from where one shape ends to where the next begins
 * Note: x is top-left corner (Konva default)
 * @param shapes - Array of shapes to distribute
 * @param alignVertically - If true, also aligns shapes to same vertical center (for straight row)
 */
export const distributeHorizontal = (shapes: Shape[], alignVertically: boolean = false): Map<string, { x: number } | { x: number; y: number }> => {
  if (shapes.length < 2) return new Map(); // Need at least 2 shapes

  const updates = new Map<string, { x: number } | { x: number; y: number }>();
  const GAP = 100; // Fixed gap between shapes
  
  // Sort shapes by x position (left edge)
  const sorted = [...shapes].sort((a, b) => a.x - b.x);
  
  // Calculate vertical center alignment if requested
  const avgY = alignVertically 
    ? sorted.reduce((sum, s) => sum + (s.y + s.height / 2), 0) / sorted.length
    : 0;
  
  // Calculate all positions in one pass based on current positions
  let currentX = sorted[0].x; // Start from the leftmost shape
  
  sorted.forEach((shape, index) => {
    if (index === 0) {
      if (alignVertically) {
        // First shape: align vertically but keep X position
        updates.set(shape.id, { 
          x: shape.x,
          y: avgY - shape.height / 2
        });
      }
      // First shape stays in place (X only)
      currentX = shape.x + shape.width + GAP; // Set starting point for next shape
      return;
    }
    
    // Position this shape at currentX
    if (alignVertically) {
      updates.set(shape.id, { 
        x: currentX,
        y: avgY - shape.height / 2  // Center-align vertically for straight row
      });
    } else {
      updates.set(shape.id, { x: currentX });
    }
    
    // Update currentX for the next shape (this shape's right edge + gap)
    currentX = currentX + shape.width + GAP;
  });

  return updates;
};

/**
 * Distribute shapes vertically with fixed 100px gap between edges
 * Gap from where one shape ends to where the next begins
 * Note: y is top-left corner (Konva default)
 * @param shapes - Array of shapes to distribute
 * @param alignHorizontally - If true, also aligns shapes to same horizontal center (for straight column)
 */
export const distributeVertical = (shapes: Shape[], alignHorizontally: boolean = false): Map<string, { y: number } | { x: number; y: number }> => {
  if (shapes.length < 2) return new Map(); // Need at least 2 shapes

  const updates = new Map<string, { y: number } | { x: number; y: number }>();
  const GAP = 100; // Fixed gap between shapes
  
  // Sort shapes by y position (top edge)
  const sorted = [...shapes].sort((a, b) => a.y - b.y);
  
  // Calculate horizontal center alignment if requested
  const avgX = alignHorizontally
    ? sorted.reduce((sum, s) => sum + (s.x + s.width / 2), 0) / sorted.length
    : 0;
  
  // Calculate all positions in one pass based on current positions
  let currentY = sorted[0].y; // Start from the topmost shape
  
  sorted.forEach((shape, index) => {
    if (index === 0) {
      if (alignHorizontally) {
        // First shape: align horizontally but keep Y position
        updates.set(shape.id, {
          x: avgX - shape.width / 2,
          y: shape.y
        });
      }
      // First shape stays in place (Y only)
      currentY = shape.y + shape.height + GAP; // Set starting point for next shape
      return;
    }
    
    // Position this shape at currentY
    if (alignHorizontally) {
      updates.set(shape.id, {
        x: avgX - shape.width / 2,  // Center-align horizontally for straight column
        y: currentY
      });
    } else {
      updates.set(shape.id, { y: currentY });
    }
    
    // Update currentY for the next shape (this shape's bottom edge + gap)
    currentY = currentY + shape.height + GAP;
  });

  return updates;
};

