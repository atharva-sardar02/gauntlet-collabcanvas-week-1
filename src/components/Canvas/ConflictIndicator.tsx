import { useEffect, useState } from 'react';
import { Group, Rect, Text as KonvaText } from 'react-konva';
import type { ConflictType } from '../../utils/conflictDetection';

/**
 * Conflict indicator that appears on a shape when there's a conflict
 */
interface ConflictIndicatorProps {
  x: number;
  y: number;
  width: number;
  height: number;
  conflictType: ConflictType;
  userName: string;
  userColor: string;
  onComplete?: () => void;
}

/**
 * Visual indicator shown on canvas when a conflict occurs
 * Features:
 * - Red flash animation (2 seconds)
 * - User badge showing who won the conflict
 * - Auto-dismiss after animation completes
 */
export const ConflictIndicator = ({
  x,
  y,
  width,
  height,
  conflictType,
  userName,
  userColor,
  onComplete,
}: ConflictIndicatorProps) => {
  const [opacity, setOpacity] = useState(1);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    // Pulse animation - 4 pulses over 2 seconds
    const pulseInterval = setInterval(() => {
      setPulseScale((prev) => (prev === 1 ? 1.05 : 1));
    }, 250); // 250ms = 4Hz pulse

    // Fade out animation - starts at 1.5s, ends at 2s
    const fadeTimeout = setTimeout(() => {
      const fadeInterval = setInterval(() => {
        setOpacity((prev) => {
          const newOpacity = prev - 0.1;
          if (newOpacity <= 0) {
            clearInterval(fadeInterval);
            onComplete?.();
            return 0;
          }
          return newOpacity;
        });
      }, 50); // 50ms steps = smooth fade
    }, 1500); // Start fading at 1.5s

    // Cleanup
    return () => {
      clearInterval(pulseInterval);
      clearTimeout(fadeTimeout);
    };
  }, [onComplete]);

  const indicatorColor = conflictType === 'delete_while_editing' ? '#EF4444' : '#DC2626';
  const strokeWidth = 3;

  return (
    <Group x={x} y={y} opacity={opacity}>
      {/* Red flash border */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke={indicatorColor}
        strokeWidth={strokeWidth}
        dash={[10, 5]}
        scaleX={pulseScale}
        scaleY={pulseScale}
        offsetX={width * (pulseScale - 1) / 2}
        offsetY={height * (pulseScale - 1) / 2}
        listening={false}
      />

      {/* User badge - shows who made the conflicting change */}
      <Group x={width + 10} y={-5}>
        {/* Badge background */}
        <Rect
          x={0}
          y={0}
          width={userName.length * 8 + 20}
          height={30}
          fill={userColor || '#DC2626'}
          cornerRadius={15}
          listening={false}
        />
        
        {/* User name text */}
        <KonvaText
          x={10}
          y={8}
          text={userName}
          fontSize={14}
          fontFamily="Arial"
          fill="white"
          fontStyle="bold"
          listening={false}
        />
      </Group>
    </Group>
  );
};

/**
 * Toast notification for conflicts
 * Shows at top of screen, auto-dismisses after 4 seconds
 */
interface ConflictToastProps {
  message: string;
  conflictType: ConflictType;
  userName: string;
  onClose: () => void;
}

export const ConflictToast = ({
  message,
  conflictType,
  userName,
  onClose,
}: ConflictToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      // Allow exit animation to complete
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(dismissTimer);
  }, [onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  // Different colors based on conflict severity
  const getToastStyles = () => {
    switch (conflictType) {
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
        fixed top-20 left-1/2 transform -translate-x-1/2 z-50
        px-6 py-4 rounded-lg shadow-2xl border-2
        ${getToastStyles()}
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'}
      `}
      style={{ minWidth: '300px', maxWidth: '500px' }}
    >
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <svg
          className="w-6 h-6 text-white flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        {/* Message Content */}
        <div className="flex-1">
          <div className="text-white font-bold text-sm mb-1">Conflict Detected</div>
          <div className="text-white text-sm">{message}</div>
          {userName && (
            <div className="text-white text-xs mt-1 opacity-90">
              Overwritten by: <span className="font-semibold">{userName}</span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * Container for managing multiple conflict toasts
 */
interface ConflictToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    conflictType: ConflictType;
    userName: string;
  }>;
  onRemoveToast: (id: string) => void;
}

export const ConflictToastContainer = ({
  toasts,
  onRemoveToast,
}: ConflictToastContainerProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 pointer-events-none z-50">
      <div className="flex flex-col gap-2 items-center pt-20">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              transform: `translateY(${index * 10}px)`,
              transition: 'transform 0.3s ease',
            }}
          >
            <ConflictToast
              message={toast.message}
              conflictType={toast.conflictType}
              userName={toast.userName}
              onClose={() => onRemoveToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Hook for managing conflict indicators
 */
export function useConflictIndicators() {
  const [shapeIndicators, setShapeIndicators] = useState<
    Map<string, {
      conflictType: ConflictType;
      userName: string;
      userColor: string;
      timestamp: number;
    }>
  >(new Map());

  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      conflictType: ConflictType;
      userName: string;
    }>
  >([]);

  /**
   * Show conflict indicator on a shape
   */
  const showShapeIndicator = (
    shapeId: string,
    conflictType: ConflictType,
    userName: string,
    userColor: string
  ) => {
    setShapeIndicators((prev) => {
      const next = new Map(prev);
      next.set(shapeId, {
        conflictType,
        userName,
        userColor,
        timestamp: Date.now(),
      });
      return next;
    });

    // Auto-remove after 2 seconds
    setTimeout(() => {
      removeShapeIndicator(shapeId);
    }, 2000);
  };

  /**
   * Remove conflict indicator from a shape
   */
  const removeShapeIndicator = (shapeId: string) => {
    setShapeIndicators((prev) => {
      const next = new Map(prev);
      next.delete(shapeId);
      return next;
    });
  };

  /**
   * Show toast notification for conflict
   */
  const showToast = (
    message: string,
    conflictType: ConflictType,
    userName: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        conflictType,
        userName,
      },
    ]);
  };

  /**
   * Remove toast by ID
   */
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  /**
   * Get indicator for a specific shape
   */
  const getShapeIndicator = (shapeId: string) => {
    return shapeIndicators.get(shapeId);
  };

  /**
   * Check if shape has active indicator
   */
  const hasIndicator = (shapeId: string) => {
    return shapeIndicators.has(shapeId);
  };

  /**
   * Clear all indicators
   */
  const clearAllIndicators = () => {
    setShapeIndicators(new Map());
    setToasts([]);
  };

  return {
    shapeIndicators,
    toasts,
    showShapeIndicator,
    removeShapeIndicator,
    showToast,
    removeToast,
    getShapeIndicator,
    hasIndicator,
    clearAllIndicators,
  };
}

