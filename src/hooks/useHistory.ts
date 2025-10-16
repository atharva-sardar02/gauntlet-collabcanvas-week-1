import { useContext } from 'react';
import HistoryContext from '../contexts/HistoryContext';

/**
 * Custom hook to access history context
 * Provides undo/redo functionality
 */
export const useHistory = () => {
  const context = useContext(HistoryContext);

  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }

  return context;
};

