import { describe, it, expect } from 'vitest';
import {
  getBoundingBox,
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterHorizontal,
  alignCenterVertical,
  distributeHorizontal,
  distributeVertical,
} from '../../../src/utils/alignment';
import type { Shape } from '../../../src/contexts/CanvasContext';

// Helper to create test shapes
const createTestShape = (id: string, x: number, y: number, width: number, height: number): Shape => ({
  id,
  type: 'rectangle',
  x,
  y,
  width,
  height,
  fill: '#000000',
});

describe('alignment utilities', () => {
  describe('getBoundingBox', () => {
    it('should return correct bounding box for single shape', () => {
      const shapes = [createTestShape('1', 10, 20, 100, 50)];
      const box = getBoundingBox(shapes);
      
      expect(box.left).toBe(10);
      expect(box.right).toBe(110);
      expect(box.top).toBe(20);
      expect(box.bottom).toBe(70);
      expect(box.centerX).toBe(60);
      expect(box.centerY).toBe(45);
    });

    it('should return correct bounding box for multiple shapes', () => {
      const shapes = [
        createTestShape('1', 10, 20, 100, 50),
        createTestShape('2', 200, 100, 50, 80),
      ];
      const box = getBoundingBox(shapes);
      
      expect(box.left).toBe(10);
      expect(box.right).toBe(250);
      expect(box.top).toBe(20);
      expect(box.bottom).toBe(180);
    });

    it('should handle empty shapes array', () => {
      const box = getBoundingBox([]);
      expect(box.left).toBe(0);
      expect(box.right).toBe(0);
      expect(box.top).toBe(0);
      expect(box.bottom).toBe(0);
    });
  });

  describe('alignLeft', () => {
    it('should align all shapes to the leftmost edge', () => {
      const shapes = [
        createTestShape('1', 100, 50, 50, 50),
        createTestShape('2', 200, 100, 50, 50),
        createTestShape('3', 50, 150, 50, 50),
      ];
      
      const updates = alignLeft(shapes);
      
      expect(updates.get('1')?.x).toBe(50);
      expect(updates.get('2')?.x).toBe(50);
      expect(updates.get('3')?.x).toBe(50);
    });

    it('should return empty map for empty shapes', () => {
      const updates = alignLeft([]);
      expect(updates.size).toBe(0);
    });
  });

  describe('alignRight', () => {
    it('should align all shapes to the rightmost edge', () => {
      const shapes = [
        createTestShape('1', 100, 50, 50, 50), // right edge at 150
        createTestShape('2', 200, 100, 50, 50), // right edge at 250 (rightmost)
        createTestShape('3', 50, 150, 50, 50), // right edge at 100
      ];
      
      const updates = alignRight(shapes);
      
      // All should align to x=200 (250 - 50 width)
      expect(updates.get('1')?.x).toBe(200);
      expect(updates.get('2')?.x).toBe(200);
      expect(updates.get('3')?.x).toBe(200);
    });
  });

  describe('alignTop', () => {
    it('should align all shapes to the topmost edge', () => {
      const shapes = [
        createTestShape('1', 50, 100, 50, 50),
        createTestShape('2', 100, 200, 50, 50),
        createTestShape('3', 150, 50, 50, 50),
      ];
      
      const updates = alignTop(shapes);
      
      expect(updates.get('1')?.y).toBe(50);
      expect(updates.get('2')?.y).toBe(50);
      expect(updates.get('3')?.y).toBe(50);
    });
  });

  describe('alignBottom', () => {
    it('should align all shapes to the bottommost edge', () => {
      const shapes = [
        createTestShape('1', 50, 100, 50, 50), // bottom at 150
        createTestShape('2', 100, 200, 50, 50), // bottom at 250 (bottommost)
        createTestShape('3', 150, 50, 50, 50), // bottom at 100
      ];
      
      const updates = alignBottom(shapes);
      
      // All should align to y=200 (250 - 50 height)
      expect(updates.get('1')?.y).toBe(200);
      expect(updates.get('2')?.y).toBe(200);
      expect(updates.get('3')?.y).toBe(200);
    });
  });

  describe('alignCenterHorizontal', () => {
    it('should align all shapes to center horizontally', () => {
      const shapes = [
        createTestShape('1', 0, 50, 50, 50), // right at 50
        createTestShape('2', 150, 100, 50, 50), // right at 200
      ];
      
      const updates = alignCenterHorizontal(shapes);
      
      // Bounding box: left=0, right=200, centerX=100
      // Shape with width 50 should be at x = 100 - 25 = 75
      expect(updates.get('1')?.x).toBe(75);
      expect(updates.get('2')?.x).toBe(75);
    });

    it('should handle shapes with different widths', () => {
      const shapes = [
        createTestShape('1', 0, 50, 100, 50), // width 100
        createTestShape('2', 150, 100, 50, 50), // width 50
      ];
      
      const updates = alignCenterHorizontal(shapes);
      
      // Bounding box: left=0, right=200, centerX=100
      expect(updates.get('1')?.x).toBe(50); // 100 - 100/2
      expect(updates.get('2')?.x).toBe(75); // 100 - 50/2
    });
  });

  describe('alignCenterVertical', () => {
    it('should align all shapes to center vertically', () => {
      const shapes = [
        createTestShape('1', 50, 0, 50, 50), // bottom at 50
        createTestShape('2', 100, 150, 50, 50), // bottom at 200
      ];
      
      const updates = alignCenterVertical(shapes);
      
      // Bounding box: top=0, bottom=200, centerY=100
      // Shape with height 50 should be at y = 100 - 25 = 75
      expect(updates.get('1')?.y).toBe(75);
      expect(updates.get('2')?.y).toBe(75);
    });

    it('should handle shapes with different heights', () => {
      const shapes = [
        createTestShape('1', 50, 0, 50, 100), // height 100
        createTestShape('2', 100, 150, 50, 50), // height 50
      ];
      
      const updates = alignCenterVertical(shapes);
      
      // Bounding box: top=0, bottom=200, centerY=100
      expect(updates.get('1')?.y).toBe(50); // 100 - 100/2
      expect(updates.get('2')?.y).toBe(75); // 100 - 50/2
    });
  });

  describe('distributeHorizontal', () => {
    it('should distribute 3 shapes evenly', () => {
      const shapes = [
        createTestShape('1', 0, 50, 50, 50),
        createTestShape('2', 100, 50, 50, 50),
        createTestShape('3', 200, 50, 50, 50),
      ];
      
      const updates = distributeHorizontal(shapes);
      
      // Only middle shape should be updated
      // Total width: 250 (0 to 250)
      // Shapes width: 150 (3 * 50)
      // Spacing: (250 - 150) / 2 = 50
      // Middle shape should be at 0 + 50 (width) + 50 (spacing) = 100
      expect(updates.has('1')).toBe(false); // First stays in place
      expect(updates.get('2')?.x).toBe(100);
      expect(updates.has('3')).toBe(false); // Last stays in place
    });

    it('should handle shapes with different widths', () => {
      const shapes = [
        createTestShape('1', 0, 50, 50, 50),
        createTestShape('2', 100, 50, 80, 50),
        createTestShape('3', 200, 50, 50, 50),
      ];
      
      const updates = distributeHorizontal(shapes);
      
      // Total width: 250 (0 to 250)
      // Shapes width: 180 (50 + 80 + 50)
      // Spacing: (250 - 180) / 2 = 35
      // Middle shape should be at 0 + 50 (width) + 35 (spacing) = 85
      expect(updates.has('1')).toBe(false);
      expect(updates.get('2')?.x).toBe(85);
      expect(updates.has('3')).toBe(false);
    });

    it('should return empty map for less than 3 shapes', () => {
      const shapes = [
        createTestShape('1', 0, 50, 50, 50),
        createTestShape('2', 100, 50, 50, 50),
      ];
      
      const updates = distributeHorizontal(shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('distributeVertical', () => {
    it('should distribute 3 shapes evenly', () => {
      const shapes = [
        createTestShape('1', 50, 0, 50, 50),
        createTestShape('2', 50, 100, 50, 50),
        createTestShape('3', 50, 200, 50, 50),
      ];
      
      const updates = distributeVertical(shapes);
      
      // Only middle shape should be updated
      // Total height: 250 (0 to 250)
      // Shapes height: 150 (3 * 50)
      // Spacing: (250 - 150) / 2 = 50
      // Middle shape should be at 0 + 50 (height) + 50 (spacing) = 100
      expect(updates.has('1')).toBe(false); // First stays in place
      expect(updates.get('2')?.y).toBe(100);
      expect(updates.has('3')).toBe(false); // Last stays in place
    });

    it('should handle shapes with different heights', () => {
      const shapes = [
        createTestShape('1', 50, 0, 50, 50),
        createTestShape('2', 50, 100, 50, 80),
        createTestShape('3', 50, 200, 50, 50),
      ];
      
      const updates = distributeVertical(shapes);
      
      // Total height: 250 (0 to 250)
      // Shapes height: 180 (50 + 80 + 50)
      // Spacing: (250 - 180) / 2 = 35
      // Middle shape should be at 0 + 50 (height) + 35 (spacing) = 85
      expect(updates.has('1')).toBe(false);
      expect(updates.get('2')?.y).toBe(85);
      expect(updates.has('3')).toBe(false);
    });

    it('should return empty map for less than 3 shapes', () => {
      const shapes = [
        createTestShape('1', 50, 0, 50, 50),
        createTestShape('2', 50, 100, 50, 50),
      ];
      
      const updates = distributeVertical(shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle shapes at canvas boundaries', () => {
      const shapes = [
        createTestShape('1', 0, 0, 50, 50),
        createTestShape('2', 4950, 4950, 50, 50),
      ];
      
      const updates = alignLeft(shapes);
      
      // Should align to leftmost (0)
      expect(updates.get('1')?.x).toBe(0);
      expect(updates.get('2')?.x).toBe(0);
    });

    it('should handle single shape alignment (no-op)', () => {
      const shapes = [createTestShape('1', 100, 100, 50, 50)];
      
      const updates = alignLeft(shapes);
      
      // Should return update to same position
      expect(updates.get('1')?.x).toBe(100);
    });

    it('should maintain 1px tolerance for alignment', () => {
      const shapes = [
        createTestShape('1', 100.0, 50, 50, 50),
        createTestShape('2', 100.2, 100, 50, 50),
        createTestShape('3', 99.8, 150, 50, 50),
      ];
      
      const updates = alignLeft(shapes);
      
      // Should align to leftmost (99.8)
      const targetX = 99.8;
      expect(Math.abs(updates.get('1')!.x - targetX)).toBeLessThan(1);
      expect(Math.abs(updates.get('2')!.x - targetX)).toBeLessThan(1);
      expect(Math.abs(updates.get('3')!.x - targetX)).toBeLessThan(1);
    });
  });
});

