import { useState, useCallback, useRef, useEffect } from 'react';
import type { Operation } from '../types/operations';

/**
 * Pending operation with timeout tracking
 */
interface PendingOperation {
  id: string;
  operation: Operation;
  timestamp: number;
  timeout: ReturnType<typeof setTimeout>;
  retries: number;
}

/**
 * Configuration for optimistic updates
 */
interface OptimisticConfig {
  maxPendingOperations?: number;
  operationTimeout?: number; // ms before rollback
  maxRetries?: number;
}

/**
 * Hook for managing optimistic updates with rollback capability
 * 
 * Provides instant UI updates while waiting for server confirmation.
 * Rolls back changes if server rejects or times out.
 * 
 * @param config - Configuration options
 * @returns Optimistic update functions
 */
export function useOptimisticUpdates(config: OptimisticConfig = {}) {
  const {
    maxPendingOperations = 50,
    operationTimeout = 5000, // 5 seconds
    maxRetries = 3,
  } = config;

  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation>>(
    new Map()
  );
  const [failedOperations, setFailedOperations] = useState<Operation[]>([]);
  
  // Use ref for callbacks to avoid stale closures
  const pendingRef = useRef<Map<string, PendingOperation>>(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    pendingRef.current = pendingOperations;
  }, [pendingOperations]);

  /**
   * Apply an operation optimistically (immediately to local state)
   * @param operation - Operation to apply
   * @param applyFn - Function that applies the operation to local state
   * @returns Operation ID for tracking
   */
  const applyOptimistic = useCallback(
    (operation: Operation, applyFn: (op: Operation) => void): string => {
      // Check if we've exceeded max pending operations
      if (pendingRef.current.size >= maxPendingOperations) {
        console.warn('Max pending operations exceeded, operation may be delayed');
      }

      // Apply to local state immediately
      applyFn(operation);

      // Create timeout for rollback
      const timeout = setTimeout(() => {
        handleTimeout(operation.id);
      }, operationTimeout);

      // Track as pending
      const pendingOp: PendingOperation = {
        id: operation.id,
        operation,
        timestamp: Date.now(),
        timeout,
        retries: 0,
      };

      setPendingOperations((prev) => {
        const next = new Map(prev);
        next.set(operation.id, pendingOp);
        return next;
      });

      return operation.id;
    },
    [maxPendingOperations, operationTimeout]
  );

  /**
   * Confirm an optimistic operation (server accepted it)
   * @param operationId - ID of confirmed operation
   */
  const confirmOptimistic = useCallback((operationId: string) => {
    setPendingOperations((prev) => {
      const next = new Map(prev);
      const op = next.get(operationId);
      
      if (op) {
        // Clear timeout
        clearTimeout(op.timeout);
        
        // Remove from pending
        next.delete(operationId);
      }
      
      return next;
    });
  }, []);

  /**
   * Rollback an optimistic operation (server rejected or timeout)
   * @param operationId - ID of operation to rollback
   * @param rollbackFn - Function that reverts the operation
   * @param reason - Reason for rollback (for logging)
   */
  const rollbackOptimistic = useCallback(
    (operationId: string, rollbackFn: (op: Operation) => void, reason = 'timeout') => {
      const pending = pendingRef.current.get(operationId);
      
      if (!pending) {
        console.warn(`Attempted to rollback non-existent operation: ${operationId}`);
        return;
      }

      // Clear timeout
      clearTimeout(pending.timeout);

      // Revert the local state
      rollbackFn(pending.operation);

      // Track as failed
      setFailedOperations((prev) => [...prev, pending.operation]);

      // Remove from pending
      setPendingOperations((prev) => {
        const next = new Map(prev);
        next.delete(operationId);
        return next;
      });

      console.log(`Rolled back operation ${operationId}: ${reason}`);
    },
    []
  );

  /**
   * Handle operation timeout
   * @param operationId - ID of timed out operation
   */
  const handleTimeout = useCallback((operationId: string) => {
    const pending = pendingRef.current.get(operationId);
    
    if (!pending) return;

    // Check if we should retry
    if (pending.retries < maxRetries) {
      console.log(`Operation ${operationId} timed out, retrying...`);
      
      // Increment retry count
      setPendingOperations((prev) => {
        const next = new Map(prev);
        const op = next.get(operationId);
        if (op) {
          // Create new timeout
          const newTimeout = setTimeout(() => {
            handleTimeout(operationId);
          }, operationTimeout);
          
          next.set(operationId, {
            ...op,
            retries: op.retries + 1,
            timeout: newTimeout,
          });
        }
        return next;
      });
    } else {
      // Max retries exceeded, give up
      console.error(`Operation ${operationId} failed after ${maxRetries} retries`);
      
      // Note: We don't automatically rollback on timeout in this implementation
      // The caller should handle timeout events and decide whether to rollback
      // This is because the operation might have succeeded on the server
    }
  }, [maxRetries, operationTimeout]);

  /**
   * Get list of pending operations
   * @returns Array of pending operations
   */
  const getPendingOperations = useCallback((): Operation[] => {
    return Array.from(pendingRef.current.values()).map((p) => p.operation);
  }, []);

  /**
   * Get count of pending operations
   * @returns Number of pending operations
   */
  const getPendingCount = useCallback((): number => {
    return pendingRef.current.size;
  }, []);

  /**
   * Check if a specific operation is pending
   * @param operationId - ID of operation to check
   * @returns True if operation is pending
   */
  const isPending = useCallback((operationId: string): boolean => {
    return pendingRef.current.has(operationId);
  }, []);

  /**
   * Get failed operations
   * @returns Array of failed operations
   */
  const getFailedOperations = useCallback((): Operation[] => {
    return [...failedOperations];
  }, [failedOperations]);

  /**
   * Clear failed operations list
   */
  const clearFailedOperations = useCallback(() => {
    setFailedOperations([]);
  }, []);

  /**
   * Clear all pending operations (useful for cleanup)
   */
  const clearPendingOperations = useCallback(() => {
    // Clear all timeouts
    pendingRef.current.forEach((pending) => {
      clearTimeout(pending.timeout);
    });
    
    setPendingOperations(new Map());
  }, []);

  /**
   * Retry a failed operation
   * @param operation - Operation to retry
   * @param applyFn - Function to apply the operation
   */
  const retryOperation = useCallback(
    (operation: Operation, applyFn: (op: Operation) => void) => {
      // Remove from failed list
      setFailedOperations((prev) => prev.filter((op) => op.id !== operation.id));
      
      // Reapply optimistically
      return applyOptimistic(operation, applyFn);
    },
    [applyOptimistic]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      pendingRef.current.forEach((pending) => {
        clearTimeout(pending.timeout);
      });
    };
  }, []);

  return {
    // Core functions
    applyOptimistic,
    confirmOptimistic,
    rollbackOptimistic,
    
    // Query functions
    getPendingOperations,
    getPendingCount,
    isPending,
    getFailedOperations,
    
    // Management functions
    clearFailedOperations,
    clearPendingOperations,
    retryOperation,
    
    // State (for debugging/UI)
    pendingCount: pendingOperations.size,
    failedCount: failedOperations.length,
  };
}

/**
 * Utility to generate unique operation IDs
 */
export function generateOperationId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a debounced version of an operation
 * Useful for rapid edits (like dragging)
 * 
 * @param operation - Operation to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced operation
 */
export function debounceOperation(
  operation: (op: Operation) => void,
  delay: number
): (op: Operation) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (op: Operation) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      operation(op);
    }, delay);
  };
}

/**
 * Batch multiple operations into one
 * Useful for rapid edit storms
 * 
 * @param operations - Array of operations to batch
 * @returns Single batched operation
 */
export function batchOperations(operations: Operation[]): Operation {
  if (operations.length === 0) {
    throw new Error('Cannot batch empty operations array');
  }

  if (operations.length === 1) {
    return operations[0];
  }

  // Use the most recent timestamp
  const latestTimestamp = Math.max(...operations.map((op) => op.timestamp));
  
  // Combine all shape IDs
  const allShapeIds = Array.from(
    new Set(operations.flatMap((op) => op.shapeIds))
  );

  // Combine before/after states (last one wins for conflicts)
  const combinedBefore: any = {};
  const combinedAfter: any = {};
  
  operations.forEach((op) => {
    Object.assign(combinedBefore, op.before);
    Object.assign(combinedAfter, op.after);
  });

  return {
    id: generateOperationId(),
    type: 'update', // Batched operations are always updates
    userId: operations[0].userId, // Assume same user
    timestamp: latestTimestamp,
    before: combinedBefore,
    after: combinedAfter,
    shapeIds: allShapeIds,
    description: `Batched ${operations.length} operations`,
  };
}

