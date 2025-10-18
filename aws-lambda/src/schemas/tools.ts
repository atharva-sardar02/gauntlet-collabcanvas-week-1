import { z } from 'zod';

/**
 * Tool schemas for AI Canvas Agent
 * These define the tools the AI can call to manipulate the canvas
 */

// 0. Get Shapes - Query existing shapes on the canvas
export const getShapesSchema = z.object({
  filter: z.object({
    type: z.enum(['rectangle', 'circle', 'triangle', 'star', 'text']).optional().describe('Filter by shape type'),
    fill: z.string().optional().describe('Filter by fill color (partial match)'),
  }).optional().describe('Optional filters to narrow down results'),
});

// 1. Create Shape - Create rectangle, circle, triangle, or star
export const createShapeSchema = z.object({
  type: z.enum(['rectangle', 'circle', 'triangle', 'star']),
  x: z.number().describe('X position (top-left corner)'),
  y: z.number().describe('Y position (top-left corner)'),
  width: z.number().positive().describe('Width in pixels'),
  height: z.number().positive().describe('Height in pixels'),
  fill: z.string().optional().default('#3B82F6').describe('Fill color (hex)'),
  stroke: z.string().optional().describe('Stroke color (hex)'),
  opacity: z.number().min(0).max(1).optional().default(1).describe('Opacity from 0 (transparent) to 1 (opaque)'),
  blendMode: z.enum(['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion']).optional().default('source-over').describe('Blend mode for visual effects'),
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

// 4a. Update Shape - Update shape properties (color, opacity, blend mode, etc.)
export const updateShapeSchema = z.object({
  id: z.string().describe('Shape ID to update'),
  fill: z.string().optional().describe('Fill color (hex)'),
  stroke: z.string().optional().describe('Stroke color (hex)'),
  opacity: z.number().min(0).max(1).optional().describe('Opacity from 0 (transparent) to 1 (opaque)'),
  blendMode: z.enum(['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion']).optional().describe('Blend mode for visual effects'),
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

// 11. Bulk Create Shapes - Efficiently create many shapes in a pattern
export const bulkCreateShapesSchema = z.object({
  pattern: z.enum(['grid', 'row', 'column', 'circle', 'spiral']).describe('Layout pattern for shapes'),
  shape: z.enum(['rectangle', 'circle', 'ellipse', 'triangle', 'star']).describe('Shape type'),
  count: z.number().positive().max(1000).describe('Number of shapes to create (max 1000)'),
  style: z.object({
    fill: z.string().optional().default('#3B82F6').describe('Fill color (hex)'),
    stroke: z.string().optional().describe('Stroke color (hex)'),
    width: z.number().positive().optional().default(50).describe('Shape width'),
    height: z.number().positive().optional().default(50).describe('Shape height'),
    opacity: z.number().min(0).max(1).optional().default(1).describe('Opacity from 0 (transparent) to 1 (opaque)'),
    blendMode: z.enum(['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten']).optional().default('source-over').describe('Blend mode'),
  }).optional().default({}),
  layout: z.object({
    rows: z.number().positive().optional().describe('Number of rows (for grid pattern)'),
    cols: z.number().positive().optional().describe('Number of columns (for grid pattern)'),
    spacing: z.number().optional().default(10).describe('Spacing between shapes in pixels'),
    origin: z.object({
      x: z.number().default(100),
      y: z.number().default(100),
    }).optional().default({ x: 100, y: 100 }).describe('Starting position'),
    radius: z.number().positive().optional().describe('Radius for circle/spiral pattern'),
  }).optional().default({}),
});

// 12. Create Complex Layout - Create complex UI components
export const createComplexLayoutSchema = z.object({
  type: z.enum(['login_form', 'navbar', 'card', 'button_group', 'form', 'dashboard']).describe('Type of complex layout'),
  config: z.object({
    title: z.string().optional().describe('Title or heading text'),
    items: z.array(z.string()).optional().describe('List of items (menu items, buttons, etc.)'),
    fields: z.array(z.string()).optional().describe('Form field labels'),
    style: z.object({
      primaryColor: z.string().optional().default('#3B82F6'),
      backgroundColor: z.string().optional().default('#FFFFFF'),
      textColor: z.string().optional().default('#000000'),
    }).optional().default({}),
  }).optional().default({}),
  position: z.object({
    x: z.number().default(100),
    y: z.number().default(100),
  }).optional().default({ x: 100, y: 100 }).describe('Position of the layout'),
});

// Export all schemas
export const toolSchemas = {
  getShapes: getShapesSchema,
  createShape: createShapeSchema,
  moveShape: moveShapeSchema,
  resizeShape: resizeShapeSchema,
  rotateShape: rotateShapeSchema,
  updateShape: updateShapeSchema,
  align: alignSchema,
  distribute: distributeSchema,
  createText: createTextSchema,
  makeComponent: makeComponentSchema,
  instantiateComponent: instantiateComponentSchema,
  export: exportSchema,
  bulkCreateShapes: bulkCreateShapesSchema,
  createComplexLayout: createComplexLayoutSchema,
};

// Type exports for TypeScript
export type GetShapesArgs = z.infer<typeof getShapesSchema>;
export type CreateShapeArgs = z.infer<typeof createShapeSchema>;
export type MoveShapeArgs = z.infer<typeof moveShapeSchema>;
export type ResizeShapeArgs = z.infer<typeof resizeShapeSchema>;
export type RotateShapeArgs = z.infer<typeof rotateShapeSchema>;
export type UpdateShapeArgs = z.infer<typeof updateShapeSchema>;
export type AlignArgs = z.infer<typeof alignSchema>;
export type DistributeArgs = z.infer<typeof distributeSchema>;
export type CreateTextArgs = z.infer<typeof createTextSchema>;
export type MakeComponentArgs = z.infer<typeof makeComponentSchema>;
export type InstantiateComponentArgs = z.infer<typeof instantiateComponentSchema>;
export type ExportArgs = z.infer<typeof exportSchema>;
export type BulkCreateShapesArgs = z.infer<typeof bulkCreateShapesSchema>;
export type CreateComplexLayoutArgs = z.infer<typeof createComplexLayoutSchema>;


