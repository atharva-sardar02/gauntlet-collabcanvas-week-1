import { useState, useEffect, useCallback } from 'react';

const RECENT_COLORS_KEY = 'collabcanvas_recent_colors';
const MAX_RECENT_COLORS = 10;

export interface RecentColorsHook {
  recentColors: string[];
  addRecentColor: (color: string) => void;
  clearRecentColors: () => void;
}

/**
 * Hook to manage recent colors in localStorage
 */
export function useRecentColors(): RecentColorsHook {
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load recent colors:', error);
      return [];
    }
  });

  // Save to localStorage whenever recentColors changes
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recentColors));
    } catch (error) {
      console.error('Failed to save recent colors:', error);
    }
  }, [recentColors]);

  /**
   * Add a color to recent colors (FIFO queue)
   * Deduplicates and maintains max size
   */
  const addRecentColor = useCallback((color: string) => {
    setRecentColors((prev) => {
      // Normalize color to uppercase hex
      const normalizedColor = color.toUpperCase();
      
      // Remove if already exists
      const filtered = prev.filter((c) => c !== normalizedColor);
      
      // Add to front and limit to MAX_RECENT_COLORS
      return [normalizedColor, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  }, []);

  /**
   * Clear all recent colors
   */
  const clearRecentColors = useCallback(() => {
    setRecentColors([]);
    localStorage.removeItem(RECENT_COLORS_KEY);
  }, []);

  return {
    recentColors,
    addRecentColor,
    clearRecentColors,
  };
}

