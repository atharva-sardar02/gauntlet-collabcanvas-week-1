import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean; // Command key on Mac
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

interface UseKeyboardOptions {
  enabled?: boolean;
}

/**
 * Custom hook to manage keyboard shortcuts
 * Handles focus/blur states and prevents default browser behaviors
 */
export const useKeyboard = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardOptions = {}
) => {
  const { enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcutsRef.current) {
        const keyMatches = event.key === shortcut.key || event.code === shortcut.key;
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.handler(event);
          break; // Only trigger first matching shortcut
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Could expose methods here if needed
  };
};

/**
 * Hook specifically for handling key repeat events (like arrow keys)
 * Tracks key down/up states for continuous actions
 */
export const useKeyRepeat = (
  onRepeat: (key: string, shiftKey: boolean) => void,
  keys: string[],
  options: UseKeyboardOptions = {}
) => {
  const { enabled = true } = options;
  const pressedKeys = useRef<Set<string>>(new Set());
  const repeatInterval = useRef<number | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (keys.includes(event.key)) {
        event.preventDefault();

        // If key not already pressed, start repeating
        if (!pressedKeys.current.has(event.key)) {
          pressedKeys.current.add(event.key);
          
          // Immediate first trigger
          onRepeat(event.key, event.shiftKey);

          // Start repeat interval
          repeatInterval.current = window.setInterval(() => {
            onRepeat(event.key, event.shiftKey);
          }, 50); // Repeat every 50ms for smooth nudging
        }
      }
    },
    [enabled, keys, onRepeat]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      if (keys.includes(event.key)) {
        event.preventDefault();
        pressedKeys.current.delete(event.key);

        // Stop repeat interval if no keys pressed
        if (pressedKeys.current.size === 0 && repeatInterval.current !== null) {
          clearInterval(repeatInterval.current);
          repeatInterval.current = null;
        }
      }
    },
    [enabled, keys]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Clear interval on cleanup
      if (repeatInterval.current !== null) {
        clearInterval(repeatInterval.current);
      }
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  return {
    isPressed: (key: string) => pressedKeys.current.has(key),
  };
};

