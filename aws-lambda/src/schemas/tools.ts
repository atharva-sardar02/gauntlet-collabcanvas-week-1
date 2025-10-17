import { z } from 'zod';

/**
 * Tool schemas for AI Canvas Agent
 * These define the 10 tools the AI can call to manipulate the canvas
 */

// 1. Create Shape - Create rectangle, circle, triangle, or star
export const createShapeSchema = z.object({
  type: z.enum(['rectangle', 'circle', 'triangle', 'star']),
  x: z.number().describe('X position (top-left corner)'),
  y: z.number().describe('Y position (top-left corner)'),
  width: z.number().positive().describe('Width in pixels'),
  height: z.number().positive().describe('Height in pixels'),
  fill: z.string().optional().default('#3B82F6').describe('Fill color (hex)'),
  stroke: z.string().optional().describe('Stroke color (hex)'),
});

// 2. Move Shape - Move existing shape to new position
export const moveShapeSchema = z.object({
  id: z.string().describe('Shape ID to move'),
  x: z.number().describe('New X position'),
  y: z.number().describe('New Y position'),
});

// 3. Resize Shape - Change shape dimensions
export const resizeShapeSchema = z.object({
  id: z.string().describe('Shape ID to resize'),
  width: z.number().positive().describe('New width in pixels'),
  height: z.number().positive().describe('New height in pixels'),
});

// 4. Rotate Shape - Rotate shape by degrees
export const rotateShapeSchema = z.object({
  id: z.string().describe('Shape ID to rotate'),
  degrees: z.number().describe('Rotation angle in degrees'),
});

// 5. Align Shapes - Align multiple shapes
export const alignSchema = z.object({
  ids: z.array(z.string()).min(1).describe('Array of shape IDs to align'),
  mode: z.enum(['left', 'right', 'top', 'bottom', 'center-h', 'center-v']).describe('Alignment mode'),
});

// 6. Distribute Shapes - Distribute shapes evenly
export const distributeSchema = z.object({
  ids: z.array(z.string()).min(2).describe('Array of shape IDs to distribute (minimum 2)'),
  axis: z.enum(['horizontal', 'vertical']).describe('Distribution axis'),
});

// 7. Create Text - Create text element
export const createTextSchema = z.object({
  text: z.string().describe('Text content'),
  x: z.number().describe('X position'),
  y: z.number().describe('Y position'),
  fontSize: z.number().positive().optional().default(16).describe('Font size in pixels'),
  fill: z.string().optional().default('#000000').describe('Text color (hex)'),
  fontFamily: z.string().optional().default('Arial').describe('Font family'),
  bold: z.boolean().optional().default(false).describe('Bold text'),
  italic: z.boolean().optional().default(false).describe('Italic text'),
});

// 8. Make Component - Create reusable component (future feature)
export const makeComponentSchema = z.object({
  selectionIds: z.array(z.string()).min(1).describe('Array of shape IDs to group into component'),
  name: z.string().describe('Component name'),
});

// 9. Instantiate Component - Create component instance (future feature)
export const instantiateComponentSchema = z.object({
  componentId: z.string().describe('Component ID to instantiate'),
  x: z.number().describe('X position for instance'),
  y: z.number().describe('Y position for instance'),
});

// 10. Export Canvas - Export canvas or selection as PNG
export const exportSchema = z.object({
  scope: z.enum(['canvas', 'selection']).describe('Export entire canvas or selected shapes only'),
  format: z.literal('png').describe('Export format (only PNG supported)'),
  pixelRatio: z.number().optional().default(1).describe('Pixel ratio (1x, 2x, 3x)'),
});

// Export all schemas
export const toolSchemas = {
  createShape: createShapeSchema,
  moveShape: moveShapeSchema,
  resizeShape: resizeShapeSchema,
  rotateShape: rotateShapeSchema,
  align: alignSchema,
  distribute: distributeSchema,
  createText: createTextSchema,
  makeComponent: makeComponentSchema,
  instantiateComponent: instantiateComponentSchema,
  export: exportSchema,
};

// Type exports for TypeScript
export type CreateShapeArgs = z.infer<typeof createShapeSchema>;
export type MoveShapeArgs = z.infer<typeof moveShapeSchema>;
export type ResizeShapeArgs = z.infer<typeof resizeShapeSchema>;
export type RotateShapeArgs = z.infer<typeof rotateShapeSchema>;
export type AlignArgs = z.infer<typeof alignSchema>;
export type DistributeArgs = z.infer<typeof distributeSchema>;
export type CreateTextArgs = z.infer<typeof createTextSchema>;
export type MakeComponentArgs = z.infer<typeof makeComponentSchema>;
export type InstantiateComponentArgs = z.infer<typeof instantiateComponentSchema>;
export type ExportArgs = z.infer<typeof exportSchema>;


