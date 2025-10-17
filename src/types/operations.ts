/**
 * Operation types for undo/redo system
 * Tracks all user-initiated canvas operations
 */

import type { Shape } from '../contexts/CanvasContext';

/**
 * Types of operations that can be undone/redone
 */
export type OperationType = 
  | 'create' 
  | 'move' 
  | 'resize' 
  | 'rotate' 
  | 'delete' 
  | 'duplicate' 
  | 'transform'
  | 'update'
  | 'reorder';

/**
 * State snapshot for before/after comparison
 */
export interface OperationState {
  shapes?: Shape[];
  shapeData?: Partial<Shape>;
}

/**
 * Operation record for history tracking
 * Each operation stores enough information to reverse it
 */
export interface Operation {
  /** Unique operation identifier */
  id: string;
  
  /** Type of operation performed */
  type: OperationType;
  
  /** User who performed the operation */
  userId: string;
  
  /** Timestamp when operation occurred */
  timestamp: number;
  
  /** State before the operation */
  before: OperationState;
  
  /** State after the operation */
  after: OperationState;
  
  /** IDs of shapes affected by this operation */
  shapeIds: string[];
  
  /** Optional version number for conflict resolution */
  version?: number;
  
  /** Optional description for debugging/display */
  description?: string;
}

/**
 * Helper to create an operation record
 */
export const createOperation = (
  type: OperationType,
  userId: string,
  shapeIds: string[],
  before: OperationState,
  after: OperationState,
  description?: string
): Operation => {
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    userId,
    timestamp: Date.now(),
    before,
    after,
    shapeIds,
    description,
  };
};

/**
 * Get human-readable operation description
 */
export const getOperationDescription = (operation: Operation): string => {
  if (operation.description) return operation.description;
  
  const count = operation.shapeIds.length;
  const plural = count > 1 ? 's' : '';
  
  switch (operation.type) {
    case 'create':
      return `Created ${count} shape${plural}`;
    case 'delete':
      return `Deleted ${count} shape${plural}`;
    case 'move':
      return `Moved ${count} shape${plural}`;
    case 'duplicate':
      return `Duplicated ${count} shape${plural}`;
    case 'resize':
      return `Resized ${count} shape${plural}`;
    case 'rotate':
      return `Rotated ${count} shape${plural}`;
    case 'transform':
      return `Transformed ${count} shape${plural}`;
    case 'update':
      return `Updated ${count} shape${plural}`;
    case 'reorder':
      return `Reordered ${count} shape${plural}`;
    default:
      return `Modified ${count} shape${plural}`;
  }
};

