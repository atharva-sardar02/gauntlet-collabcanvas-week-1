import type { Shape } from '../contexts/CanvasContext';

/**
 * Detection for create collision conflicts (Task 13.5.10)
 * 
 * Note: Firestore auto-generates unique IDs, so ID collisions are impossible.
 * This utility detects position overlaps when shapes are created simultaneously.
 */

/**
 * Check if two shapes overlap in position
 * @param shape1 - First shape
 * @param shape2 - Second shape
 * @param threshold - Overlap threshold in pixels (default: 50px)
 * @returns True if shapes overlap significantly
 */
export function doShapesOverlap(
  shape1: Pick<Shape, 'x' | 'y' | 'width' | 'height'>,
  shape2: Pick<Shape, 'x' | 'y' | 'width' | 'height'>,
  threshold: number = 50
): boolean {
  // Check if centers are close
  const centerX1 = shape1.x + shape1.width / 2;
  const centerY1 = shape1.y + shape1.height / 2;
  const centerX2 = shape2.x + shape2.width / 2;
  const centerY2 = shape2.y + shape2.height / 2;

  const distanceX = Math.abs(centerX1 - centerX2);
  const distanceY = Math.abs(centerY1 - centerY2);

  // If centers are within threshold, consider overlapping
  return distanceX < threshold && distanceY < threshold;
}

/**
 * Check if a shape was created at nearly the same time as another
 * @param shape1 - First shape
 * @param shape2 - Second shape
 * @param timeWindowMs - Time window in milliseconds (default: 1000ms)
 * @returns True if created within time window
 */
export function wereCreatedSimultaneously(
  shape1: Pick<Shape, 'createdAt'>,
  shape2: Pick<Shape, 'createdAt'>,
  timeWindowMs: number = 1000
): boolean {
  if (!shape1.createdAt || !shape2.createdAt) return false;

  const timeDiff = Math.abs(shape1.createdAt - shape2.createdAt);
  return timeDiff < timeWindowMs;
}

/**
 * Detect create collision between shapes
 * @param shape1 - First shape
 * @param shape2 - Second shape
 * @returns Object with collision details
 */
export function detectCreateCollision(
  shape1: Shape,
  shape2: Shape
): {
  hasCollision: boolean;
  overlaps: boolean;
  simultaneousCreate: boolean;
  timeDifferenceMs: number;
  distanceBetweenCenters: number;
} {
  const simultaneousCreate = wereCreatedSimultaneously(shape1, shape2);
  const overlaps = doShapesOverlap(shape1, shape2);

  const centerX1 = shape1.x + shape1.width / 2;
  const centerY1 = shape1.y + shape1.height / 2;
  const centerX2 = shape2.x + shape2.width / 2;
  const centerY2 = shape2.y + shape2.height / 2;

  const distanceBetweenCenters = Math.sqrt(
    Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
  );

  const timeDifferenceMs = shape1.createdAt && shape2.createdAt
    ? Math.abs(shape1.createdAt - shape2.createdAt)
    : Infinity;

  return {
    hasCollision: simultaneousCreate && overlaps,
    overlaps,
    simultaneousCreate,
    timeDifferenceMs,
    distanceBetweenCenters,
  };
}

/**
 * Find all shapes that collided during creation
 * @param shapes - All shapes on canvas
 * @param recentTimeWindowMs - How far back to look (default: 5000ms = 5 seconds)
 * @returns Array of collision groups
 */
export function findCreateCollisions(
  shapes: Shape[],
  recentTimeWindowMs: number = 5000
): Array<{
  shapes: Shape[];
  createdAt: number;
}> {
  const now = Date.now();
  const recentShapes = shapes.filter(
    (shape) => shape.createdAt && now - shape.createdAt < recentTimeWindowMs
  );

  const collisionGroups: Array<{ shapes: Shape[]; createdAt: number }> = [];

  // Group shapes created simultaneously that overlap
  for (let i = 0; i < recentShapes.length; i++) {
    const shape1 = recentShapes[i];
    const group: Shape[] = [shape1];

    for (let j = i + 1; j < recentShapes.length; j++) {
      const shape2 = recentShapes[j];
      const collision = detectCreateCollision(shape1, shape2);

      if (collision.hasCollision) {
        group.push(shape2);
      }
    }

    if (group.length > 1) {
      collisionGroups.push({
        shapes: group,
        createdAt: shape1.createdAt || Date.now(),
      });
    }
  }

  return collisionGroups;
}

/**
 * Suggest offset for new shape to avoid overlap
 * @param newShape - Shape being created
 * @param existingShapes - Shapes already on canvas
 * @param offsetStep - Step size for offset (default: 20px)
 * @returns Suggested x, y position
 */
export function suggestNonOverlappingPosition(
  newShape: Pick<Shape, 'x' | 'y' | 'width' | 'height'>,
  existingShapes: Pick<Shape, 'x' | 'y' | 'width' | 'height'>[],
  offsetStep: number = 20
): { x: number; y: number } {
  let x = newShape.x;
  let y = newShape.y;
  let attempts = 0;
  const maxAttempts = 10;

  // Try to find non-overlapping position
  while (attempts < maxAttempts) {
    const testShape = { ...newShape, x, y };
    const hasOverlap = existingShapes.some((existing) =>
      doShapesOverlap(testShape, existing, 30)
    );

    if (!hasOverlap) {
      return { x, y };
    }

    // Offset diagonally
    x += offsetStep;
    y += offsetStep;
    attempts++;
  }

  // If couldn't find position, return original
  return { x: newShape.x, y: newShape.y };
}

/**
 * Log create collision for debugging
 * @param collision - Collision details
 */
export function logCreateCollision(collision: ReturnType<typeof detectCreateCollision>): void {
  if (!collision.hasCollision) return;

  console.log(
    `%c🟡 Create Collision Detected`,
    'color: #EAB308; font-weight: bold;'
  );
  console.log('  Shapes created simultaneously:', collision.simultaneousCreate);
  console.log('  Positions overlap:', collision.overlaps);
  console.log('  Time difference:', `${collision.timeDifferenceMs}ms`);
  console.log('  Distance between centers:', `${collision.distanceBetweenCenters.toFixed(2)}px`);
  console.log(
    '  Resolution: Both shapes exist independently (no data loss)'
  );
}

/**
 * Note: Create collisions do NOT require conflict resolution because:
 * 
 * 1. Firestore auto-generates unique IDs → No ID collision possible
 * 2. Both shapes exist independently → No data loss
 * 3. Position overlap is acceptable → Users can move shapes if needed
 * 4. Last-Write-Wins (LWW) doesn't apply to creates → No winner/loser
 * 
 * This is different from update conflicts where one change overwrites another.
 * For creates, both operations succeed and both shapes exist on the canvas.
 * 
 * Optional Enhancement:
 * - Could auto-offset second shape to avoid visual overlap
 * - Could show notification: "Multiple shapes created at same location"
 * - Could highlight recently created shapes for visibility
 * 
 * But these are UI polish, not conflict resolution requirements.
 */

