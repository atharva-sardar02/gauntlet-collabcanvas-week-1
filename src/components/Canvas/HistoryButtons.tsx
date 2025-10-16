import { useState, useEffect } from 'react';

interface HistoryButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * History Buttons Component
 * Displays undo/redo buttons with tooltips
 */
const HistoryButtons = ({ onUndo, onRedo }: HistoryButtonsProps) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoTooltip, setUndoTooltip] = useState('Undo');
  const [redoTooltip, setRedoTooltip] = useState('Redo');

  // Update button states from history manager
  useEffect(() => {
    const updateStates = () => {
      const historyManager = (window as any).__historyManager;
      if (historyManager) {
        setCanUndo(historyManager.canUndo);
        setCanRedo(historyManager.canRedo);
        
        const undoDesc = historyManager.getUndoDescription?.();
        setUndoTooltip(undoDesc ? `Undo: ${undoDesc} (Ctrl+Z)` : 'Undo (Ctrl+Z)');
        
        const redoDesc = historyManager.getRedoDescription?.();
        setRedoTooltip(redoDesc ? `Redo: ${redoDesc} (Ctrl+Shift+Z)` : 'Redo (Ctrl+Shift+Z)');
      }
    };

    // Update immediately
    updateStates();

    // Update periodically
    const interval = setInterval(updateStates, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title={undoTooltip}
        className={`
          px-3 py-2 rounded-lg shadow-lg border transition-all duration-200
          ${canUndo 
            ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white cursor-pointer' 
            : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
          }
        `}
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
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" 
          />
        </svg>
      </button>

      {/* Redo Button */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title={redoTooltip}
        className={`
          px-3 py-2 rounded-lg shadow-lg border transition-all duration-200
          ${canRedo 
            ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white cursor-pointer' 
            : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
          }
        `}
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
            d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" 
          />
        </svg>
      </button>
    </div>
  );
};

export default HistoryButtons;

