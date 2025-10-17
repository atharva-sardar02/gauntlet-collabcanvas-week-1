import type { Operation } from '../types/operations';

/**
 * Types of conflicts that can occur
 */
export const ConflictType = {
  SIMULTANEOUS_MOVE: 'simultaneous_move',
  SIMULTANEOUS_RESIZE: 'simultaneous_resize',
  SIMULTANEOUS_ROTATE: 'simultaneous_rotate',
  RAPID_EDIT_STORM: 'rapid_edit_storm',
  DELETE_WHILE_EDITING: 'delete_while_editing',
  CREATE_COLLISION: 'create_collision',
  NONE: 'none',
} as const;

export type ConflictType = typeof ConflictType[keyof typeof ConflictType];

/**
 * Result of conflict detection
 */
export interface ConflictResult {
  hasConflict: boolean;
  type: ConflictType;
  winner: Operation | null;
  loser: Operation | null;
  resolution: 'remote_wins' | 'local_wins' | 'no_conflict';
  message?: string;
}

/**
 * Detect if two operations conflict
 * @param localOp - Local operation (user's current action)
 * @param remoteOp - Remote operation (received from another user)
 * @returns ConflictResult with details about the conflict
 */
export function detectConflict(
  localOp: Operation,
  remoteOp: Operation
): ConflictResult {
  // No conflict if operations are on different shapes
  if (!hasOverlappingShapes(localOp.shapeIds, remoteOp.shapeIds)) {
    return {
      hasConflict: false,
      type: ConflictType.NONE,
      winner: null,
      loser: null,
      resolution: 'no_conflict',
    };
  }

  // No conflict if from same user
  if (localOp.userId === remoteOp.userId) {
    return {
      hasConflict: false,
      type: ConflictType.NONE,
      winner: null,
      loser: null,
      resolution: 'no_conflict',
    };
  }

  // Determine conflict type
  const conflictType = getConflictType(localOp, remoteOp);

  // Resolve using Last-Write-Wins (most recent timestamp wins)
  const resolution = shouldResolveConflict(localOp.timestamp, remoteOp.timestamp);

  if (resolution === 'remote_wins') {
    return {
      hasConflict: true,
      type: conflictType,
      winner: remoteOp,
      loser: localOp,
      resolution: 'remote_wins',
      message: `Your ${localOp.type} was overwritten by another user`,
    };
  } else if (resolution === 'local_wins') {
    return {
      hasConflict: true,
      type: conflictType,
      winner: localOp,
      loser: remoteOp,
      resolution: 'local_wins',
      message: `Your ${localOp.type} overwrote another user's change`,
    };
  }

  return {
    hasConflict: false,
    type: ConflictType.NONE,
    winner: null,
    loser: null,
    resolution: 'no_conflict',
  };
}

/**
 * Determine if conflict should be resolved and who wins
 * Uses Last-Write-Wins strategy based on timestamps
 * @param localTimestamp - Timestamp of local operation
 * @param remoteTimestamp - Timestamp of remote operation
 * @returns Resolution result
 */
export function shouldResolveConflict(
  localTimestamp: number,
  remoteTimestamp: number
): 'remote_wins' | 'local_wins' | 'no_conflict' {
  const diff = Math.abs(remoteTimestamp - localTimestamp);

  // If timestamps are nearly identical (< 10ms), it's a tie - remote wins by default
  if (diff < 10) {
    return 'remote_wins';
  }

  // Last-Write-Wins: Most recent timestamp wins
  if (remoteTimestamp > localTimestamp) {
    return 'remote_wins';
  } else if (localTimestamp > remoteTimestamp) {
    return 'local_wins';
  }

  return 'no_conflict';
}

/**
 * Categorize the type of conflict between two operations
 * @param op1 - First operation
 * @param op2 - Second operation
 * @returns ConflictType
 */
export function getConflictType(op1: Operation, op2: Operation): ConflictType {
  // Delete conflicts
  if (op1.type === 'delete' || op2.type === 'delete') {
    return ConflictType.DELETE_WHILE_EDITING;
  }

  // Create conflicts (rare, but possible with near-identical timestamps)
  if (op1.type === 'create' && op2.type === 'create') {
    return ConflictType.CREATE_COLLISION;
  }

  // Movement conflicts
  if (
    (op1.type === 'move' || op1.type === 'update') &&
    (op2.type === 'move' || op2.type === 'update')
  ) {
    // Check if both operations occurred within a short time window (< 500ms)
    const timeDiff = Math.abs(op1.timestamp - op2.timestamp);
    if (timeDiff < 500) {
      return ConflictType.RAPID_EDIT_STORM;
    }
    return ConflictType.SIMULTANEOUS_MOVE;
  }

  // Resize/Transform conflicts
  if (
    (op1.type === 'resize' || op1.type === 'transform') &&
    (op2.type === 'resize' || op2.type === 'transform')
  ) {
    return ConflictType.SIMULTANEOUS_RESIZE;
  }

  // Rotate conflicts
  if (op1.type === 'rotate' && op2.type === 'rotate') {
    return ConflictType.SIMULTANEOUS_ROTATE;
  }

  // Rapid edit storm - multiple different operations in quick succession
  const timeDiff = Math.abs(op1.timestamp - op2.timestamp);
  if (timeDiff < 500) {
    return ConflictType.RAPID_EDIT_STORM;
  }

  // Default to simultaneous move for mixed operations
  return ConflictType.SIMULTANEOUS_MOVE;
}

/**
 * Check if two shape ID arrays have any overlap
 * @param shapes1 - First array of shape IDs
 * @param shapes2 - Second array of shape IDs
 * @returns True if there's at least one common shape ID
 */
function hasOverlappingShapes(shapes1: string[], shapes2: string[]): boolean {
  const set1 = new Set(shapes1);
  return shapes2.some((id) => set1.has(id));
}

/**
 * Get a user-friendly message for a conflict type
 * @param type - ConflictType
 * @param userName - Name of the user who won the conflict
 * @returns User-friendly message
 */
export function getConflictMessage(type: ConflictType, userName: string): string {
  switch (type) {
    case ConflictType.SIMULTANEOUS_MOVE:
      return `Your move was overwritten by ${userName}`;
    case ConflictType.SIMULTANEOUS_RESIZE:
      return `Your resize was overwritten by ${userName}`;
    case ConflictType.SIMULTANEOUS_ROTATE:
      return `Your rotation was overwritten by ${userName}`;
    case ConflictType.RAPID_EDIT_STORM:
      return `Your changes conflicted with ${userName}'s edits`;
    case ConflictType.DELETE_WHILE_EDITING:
      return `Shape was deleted by ${userName}`;
    case ConflictType.CREATE_COLLISION:
      return `Multiple shapes created at the same time`;
    default:
      return `Your change was overwritten by ${userName}`;
  }
}

/**
 * Determine if a conflict is severe enough to show to the user
 * @param conflict - ConflictResult
 * @returns True if user should be notified
 */
export function shouldNotifyUser(conflict: ConflictResult): boolean {
  if (!conflict.hasConflict) {
    return false;
  }

  // Always notify for deletes
  if (conflict.type === ConflictType.DELETE_WHILE_EDITING) {
    return true;
  }

  // Notify if local operation was overwritten
  if (conflict.resolution === 'remote_wins') {
    return true;
  }

  // Don't notify for create collisions (both shapes exist)
  if (conflict.type === ConflictType.CREATE_COLLISION) {
    return false;
  }

  return false;
}

/**
 * Calculate conflict severity (for logging/metrics)
 * @param conflict - ConflictResult
 * @returns Severity level (1-5, 5 being most severe)
 */
export function getConflictSeverity(conflict: ConflictResult): number {
  if (!conflict.hasConflict) {
    return 0;
  }

  switch (conflict.type) {
    case ConflictType.DELETE_WHILE_EDITING:
      return 5; // Most severe - data loss
    case ConflictType.RAPID_EDIT_STORM:
      return 4; // High - multiple conflicts
    case ConflictType.SIMULTANEOUS_RESIZE:
    case ConflictType.SIMULTANEOUS_ROTATE:
      return 3; // Medium-high - transform lost
    case ConflictType.SIMULTANEOUS_MOVE:
      return 2; // Medium - move lost
    case ConflictType.CREATE_COLLISION:
      return 1; // Low - no data loss
    default:
      return 2;
  }
}

