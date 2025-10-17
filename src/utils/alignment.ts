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
 */
export const distributeHorizontal = (shapes: Shape[]): Map<string, { x: number }> => {
  if (shapes.length < 2) return new Map(); // Need at least 2 shapes

  const updates = new Map<string, { x: number }>();
  const GAP = 100; // Fixed gap between shapes
  
  // Sort shapes by x position (left edge)
  const sorted = [...shapes].sort((a, b) => a.x - b.x);
  
  // Keep first shape in place, distribute rest with 100px gap
  sorted.forEach((shape, index) => {
    if (index === 0) {
      // First shape stays in place
      return;
    }
    
    // Previous shape's right edge: prevX + prevWidth
    // Current shape's x (left edge) should be at: rightEdge + GAP
    const prevShape = sorted[index - 1];
    const newX = prevShape.x + prevShape.width + GAP;
    
    updates.set(shape.id, { x: newX });
  });

  return updates;
};

/**
 * Distribute shapes vertically with fixed 100px gap between edges
 * Gap from where one shape ends to where the next begins
 * Note: y is top-left corner (Konva default)
 */
export const distributeVertical = (shapes: Shape[]): Map<string, { y: number }> => {
  if (shapes.length < 2) return new Map(); // Need at least 2 shapes

  const updates = new Map<string, { y: number }>();
  const GAP = 100; // Fixed gap between shapes
  
  // Sort shapes by y position (top edge)
  const sorted = [...shapes].sort((a, b) => a.y - b.y);
  
  // Keep first shape in place, distribute rest with 100px gap
  sorted.forEach((shape, index) => {
    if (index === 0) {
      // First shape stays in place
      return;
    }
    
    // Previous shape's bottom edge: prevY + prevHeight
    // Current shape's y (top edge) should be at: bottomEdge + GAP
    const prevShape = sorted[index - 1];
    const newY = prevShape.y + prevShape.height + GAP;
    
    updates.set(shape.id, { y: newY });
  });

  return updates;
};

