import { useEffect, useState } from 'react';
import type { ConflictType } from '../../utils/conflictDetection';

/**
 * Conflict resolution action
 */
export type ConflictAction = 'keep_theirs' | 'revert_mine' | 'dismiss';

/**
 * Conflict data for the panel
 */
export interface ConflictData {
  id: string;
  shapeId: string;
  conflictType: ConflictType;
  userName: string;
  userColor: string;
  message: string;
  timestamp: number;
  beforeData: any;
  afterData: any;
  theirData: any;
}

/**
 * Props for ConflictResolutionPanel
 */
interface ConflictResolutionPanelProps {
  conflict: ConflictData | null;
  onAction: (action: ConflictAction, conflictId: string) => void;
  autoCloseDelay?: number; // milliseconds, default 5000
}

/**
 * Conflict Resolution UI Panel
 * 
 * Shows when a conflict is detected, offering the user options to:
 * - Keep their changes (default, already applied by server)
 * - Revert to my version (re-apply local change)
 * - Dismiss (accept conflict, no action)
 * 
 * Auto-dismisses after 5 seconds if no action taken.
 */
export const ConflictResolutionPanel = ({
  conflict,
  onAction,
  autoCloseDelay = 5000,
}: ConflictResolutionPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (conflict) {
      setIsVisible(true);
      setIsExiting(false);
      setCountdown(Math.ceil(autoCloseDelay / 1000));

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      // Auto-dismiss timer
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, autoCloseDelay);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [conflict, autoCloseDelay]);

  const handleAction = (action: ConflictAction) => {
    if (!conflict) return;

    setIsExiting(true);
    setTimeout(() => {
      onAction(action, conflict.id);
      setIsVisible(false);
    }, 300); // Allow exit animation
  };

  const handleKeepTheirs = () => {
    handleAction('keep_theirs');
  };

  const handleRevertMine = () => {
    handleAction('revert_mine');
  };

  const handleDismiss = () => {
    handleAction('dismiss');
  };

  if (!conflict || !isVisible) {
    return null;
  }

  const getSeverityColor = () => {
    switch (conflict.conflictType) {
      case 'delete_while_editing':
        return 'bg-red-600 border-red-700';
      case 'rapid_edit_storm':
        return 'bg-orange-600 border-orange-700';
      default:
        return 'bg-yellow-600 border-yellow-700';
    }
  };

  const getSeverityIcon = () => {
    switch (conflict.conflictType) {
      case 'delete_while_editing':
        return (
          <svg className="w-12 h-12 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50 z-40
          transition-opacity duration-300
          ${isExiting ? 'opacity-0' : 'opacity-100'}
        `}
        onClick={handleDismiss}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
          w-full max-w-md mx-4
          transition-all duration-300
          ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}
      >
        <div className={`
          rounded-xl shadow-2xl border-2 overflow-hidden
          ${getSeverityColor()}
        `}>
          {/* Header */}
          <div className="px-6 py-4 flex items-center gap-4">
            {getSeverityIcon()}
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">
                Conflict Detected
              </h3>
              <p className="text-white text-sm opacity-90">
                Your edit conflicted with another user
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-5">
            {/* Message */}
            <div className="mb-4">
              <p className="text-gray-800 font-medium mb-2">
                {conflict.message}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: conflict.userColor }}
                />
                <span>Changed by: <strong>{conflict.userName}</strong></span>
              </div>
            </div>

            {/* Conflict Type */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Conflict Type
              </p>
              <p className="text-sm font-mono text-gray-700">
                {conflict.conflictType.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Keep their changes (default) */}
              <button
                onClick={handleKeepTheirs}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-blue-600 hover:bg-blue-700
                  text-white font-medium
                  transition-colors
                  flex items-center justify-center gap-2
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Keep Their Changes (Recommended)
              </button>

              {/* Revert to my version */}
              <button
                onClick={handleRevertMine}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-gray-200 hover:bg-gray-300
                  text-gray-800 font-medium
                  transition-colors
                  flex items-center justify-center gap-2
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Revert to My Version
              </button>

              {/* Auto-dismiss notice */}
              <p className="text-center text-sm text-gray-500">
                Auto-dismissing in {countdown} second{countdown !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Mini conflict notification (less intrusive alternative)
 * Shows as a small notification instead of full modal
 */
interface ConflictNotificationProps {
  conflict: ConflictData | null;
  onDismiss: (conflictId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ConflictNotification = ({
  conflict,
  onDismiss,
  position = 'bottom-right',
}: ConflictNotificationProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (conflict) {
      setIsExiting(false);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [conflict]);

  const handleDismiss = () => {
    if (!conflict) return;
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(conflict.id);
    }, 300);
  };

  if (!conflict) return null;

  const positionClasses = {
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  const getSeverityColor = () => {
    switch (conflict.conflictType) {
      case 'delete_while_editing':
        return 'bg-red-600 border-red-700';
      case 'rapid_edit_storm':
        return 'bg-orange-600 border-orange-700';
      default:
        return 'bg-yellow-600 border-yellow-700';
    }
  };

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50
        w-80 rounded-lg shadow-2xl border-2
        ${getSeverityColor()}
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm mb-1">
              Conflict Detected
            </p>
            <p className="text-white text-xs opacity-90 mb-2">
              {conflict.message}
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: conflict.userColor }}
              />
              <span className="text-white text-xs opacity-80">
                {conflict.userName}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for managing conflict resolution UI
 */
export function useConflictResolutionUI() {
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const [conflictQueue, setConflictQueue] = useState<ConflictData[]>([]);

  /**
   * Show conflict resolution panel
   */
  const showConflict = (conflict: ConflictData) => {
    // If already showing a conflict, queue this one
    if (currentConflict) {
      setConflictQueue((prev) => [...prev, conflict]);
    } else {
      setCurrentConflict(conflict);
    }
  };

  /**
   * Handle user action on conflict
   */
  const handleConflictAction = (
    action: ConflictAction,
    conflictId: string
  ): Promise<void> => {
    return new Promise((resolve) => {
      // Clear current conflict
      setCurrentConflict(null);

      // Show next conflict from queue if any
      setConflictQueue((prev) => {
        const [next, ...rest] = prev;
        if (next) {
          setTimeout(() => setCurrentConflict(next), 300);
        }
        return rest;
      });

      resolve();
    });
  };

  /**
   * Clear all conflicts
   */
  const clearAllConflicts = () => {
    setCurrentConflict(null);
    setConflictQueue([]);
  };

  /**
   * Get queue size
   */
  const getQueueSize = () => conflictQueue.length;

  return {
    currentConflict,
    conflictQueueSize: conflictQueue.length,
    showConflict,
    handleConflictAction,
    clearAllConflicts,
    getQueueSize,
  };
}

