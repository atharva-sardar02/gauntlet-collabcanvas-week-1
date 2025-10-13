/**
 * Canvas Constants
 * Defines the dimensions, center position, and grid spacing for the canvas
 */

// Canvas dimensions - 5000x5000px infinite canvas
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Initial viewport position - starts centered at (2500, 2500)
export const CANVAS_CENTER_X = 2500;
export const CANVAS_CENTER_Y = 2500;

// Grid spacing for visual grid lines
export const GRID_SPACING = 1000;

// Viewport dimensions (will be set dynamically based on window size)
export const getViewportDimensions = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight - 64, // Subtract navbar height
  };
};

// Zoom constraints
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;

// Default zoom level
export const DEFAULT_ZOOM = 1;

// Initial stage position (centered)
export const INITIAL_STAGE_POSITION = {
  x: -CANVAS_CENTER_X + (typeof window !== 'undefined' ? window.innerWidth / 2 : 0),
  y: -CANVAS_CENTER_Y + (typeof window !== 'undefined' ? (window.innerHeight - 64) / 2 : 0),
};

// Shape color palette
export const SHAPE_COLORS = [
  '#7B68EE', // Medium Slate Blue
  '#FF6B6B', // Light Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint Green
  '#FFB6C1', // Light Pink
  '#DDA15E', // Sandy Brown
  '#BC6C25', // Rust Brown
];

// Get a random shape color from the palette
export const getRandomShapeColor = (): string => {
  return SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];
};

// Minimum shape size (prevents accidental tiny shapes)
export const MIN_SHAPE_SIZE = 10;

