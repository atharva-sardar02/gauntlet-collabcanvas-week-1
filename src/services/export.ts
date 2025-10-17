import Konva from 'konva';
import type { Shape } from '../contexts/CanvasContext';

export interface ExportOptions {
  pixelRatio?: 1 | 2 | 3;
  format?: 'png';
  quality?: number;
}

/**
 * Export the entire canvas as PNG (full 5000x5000px canvas, not just viewport)
 * @param stageRef - Reference to the Konva Stage
 * @param options - Export options (pixelRatio, format, quality)
 * @returns Data URL of the exported image
 */
export const exportCanvas = async (
  stageRef: React.RefObject<Konva.Stage | null>,
  options: ExportOptions = {}
): Promise<string> => {
  const stage = stageRef.current;
  if (!stage) {
    throw new Error('Stage reference is not available');
  }

  const { pixelRatio = 1, quality = 1.0 } = options;

  try {
    // Store original stage dimensions and transform
    const originalWidth = stage.width();
    const originalHeight = stage.height();
    const originalX = stage.x();
    const originalY = stage.y();
    const originalScaleX = stage.scaleX();
    const originalScaleY = stage.scaleY();

    // Get all layers to find actual canvas dimensions (5000x5000)
    const layers = stage.getLayers();
    let canvasWidth = 5000; // Default from constants
    let canvasHeight = 5000;

    // Try to get actual dimensions from background layer
    if (layers.length > 0) {
      const backgroundLayer = layers[0];
      const children = backgroundLayer.getChildren();
      if (children.length > 0) {
        const background = children[0];
        if (background.attrs.width && background.attrs.height) {
          canvasWidth = background.attrs.width;
          canvasHeight = background.attrs.height;
        }
      }
    }

    // Temporarily set stage to full canvas size with no transform
    stage.width(canvasWidth);
    stage.height(canvasHeight);
    stage.position({ x: 0, y: 0 });
    stage.scale({ x: 1, y: 1 });

    // Export the entire stage
    const dataURL = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      quality,
    });

    // Restore original stage settings
    stage.width(originalWidth);
    stage.height(originalHeight);
    stage.position({ x: originalX, y: originalY });
    stage.scale({ x: originalScaleX, y: originalScaleY });

    return dataURL;
  } catch (error) {
    console.error('Error exporting canvas:', error);
    throw new Error('Failed to export canvas');
  }
};

/**
 * Export selected shapes as PNG
 * Creates a temporary layer with only the selected shapes
 * @param shapes - Array of shapes to export
 * @param stageRef - Reference to the Konva Stage
 * @param options - Export options (pixelRatio, format, quality)
 * @returns Data URL of the exported image
 */
export const exportSelection = async (
  shapes: Shape[],
  stageRef: React.RefObject<Konva.Stage | null>,
  options: ExportOptions = {}
): Promise<string> => {
  const stage = stageRef.current;
  if (!stage) {
    throw new Error('Stage reference is not available');
  }

  if (shapes.length === 0) {
    throw new Error('No shapes selected for export');
  }

  const { pixelRatio = 1, quality = 1.0 } = options;

  try {
    // Calculate bounding box of all selected shapes
    const bounds = calculateBoundingBox(shapes);

    // Create a temporary stage for export
    const tempStage = new Konva.Stage({
      container: document.createElement('div'),
      width: bounds.width,
      height: bounds.height,
    });

    const tempLayer = new Konva.Layer();
    tempStage.add(tempLayer);

    // Clone and add each shape to the temporary layer
    shapes.forEach((shape) => {
      let konvaShape: Konva.Shape | null = null;

      // Adjust position relative to bounding box
      const relativeX = shape.x - bounds.x;
      const relativeY = shape.y - bounds.y;

      switch (shape.type) {
        case 'rectangle':
          konvaShape = new Konva.Rect({
            x: relativeX,
            y: relativeY,
            width: shape.width,
            height: shape.height,
            fill: shape.fill,
          });
          break;
        case 'circle':
          konvaShape = new Konva.Circle({
            x: relativeX + shape.width / 2,
            y: relativeY + shape.height / 2,
            radius: Math.min(shape.width, shape.height) / 2,
            fill: shape.fill,
          });
          break;
        case 'triangle':
          const halfWidth = shape.width / 2;
          konvaShape = new Konva.Line({
            x: relativeX,
            y: relativeY,
            points: [halfWidth, 0, shape.width, shape.height, 0, shape.height],
            closed: true,
            fill: shape.fill,
          });
          break;
        case 'text':
          konvaShape = new Konva.Text({
            x: relativeX,
            y: relativeY,
            width: shape.width,
            height: shape.height,
            text: shape.text || 'Double-click to edit',
            fontSize: shape.fontSize || 16,
            fontFamily: shape.fontFamily || 'Arial',
            fontStyle: shape.fontStyle || 'normal',
            textDecoration: shape.textDecoration || '',
            fill: 'white',
            align: 'center',
            verticalAlign: 'middle',
          });
          break;
      }

      if (konvaShape) {
        tempLayer.add(konvaShape);
      }
    });

    tempLayer.draw();

    // Export the temporary stage
    const dataURL = tempStage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      quality,
    });

    // Clean up
    tempStage.destroy();

    return dataURL;
  } catch (error) {
    console.error('Error exporting selection:', error);
    throw new Error('Failed to export selection');
  }
};

/**
 * Calculate the bounding box of multiple shapes
 * @param shapes - Array of shapes
 * @returns Bounding box coordinates and dimensions
 */
const calculateBoundingBox = (shapes: Shape[]): { x: number; y: number; width: number; height: number } => {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Download a data URL as a file
 * @param dataURL - Data URL of the image
 * @param filename - Name of the file to download
 */
export const downloadDataURL = (dataURL: string, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a filename with timestamp
 * @param prefix - Prefix for the filename
 * @returns Filename with timestamp
 */
export const generateFilename = (prefix: string = 'collabcanvas'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}.png`;
};

/**
 * Calculate the file size of a data URL in KB
 * @param dataURL - Data URL of the image
 * @returns File size in KB
 */
export const getDataURLSize = (dataURL: string): number => {
  const base64 = dataURL.split(',')[1];
  const bytes = Math.ceil((base64.length * 3) / 4);
  return Math.round(bytes / 1024);
};

