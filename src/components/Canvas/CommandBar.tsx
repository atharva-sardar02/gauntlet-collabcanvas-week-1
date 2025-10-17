import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../../contexts/AIAgentContext';

/**
 * AI Command Bar Component
 * Modal overlay with text input for AI commands
 * Opens with Ctrl+/ keyboard shortcut
 */

const EXAMPLE_COMMANDS = [
  'Create a 200x300 rectangle at 100, 100',
  'Create a blue circle at 300, 200 with size 100x100',
  'Align selected shapes to the left',
  'Create a login form with username, password, and login button',
  'Build a navbar with logo and 3 menu items',
];

export function CommandBar() {
  const {
    isCommandBarOpen,
    closeCommandBar,
    executeCommand,
    isProcessing,
    error,
    commandHistory,
    progress,
  } = useAIAgent();

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isCommandBarOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommandBarOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isCommandBarOpen) {
      setInput('');
      setHistoryIndex(-1);
    }
  }, [isCommandBarOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    try {
      await executeCommand(input);
      setInput('');
      // Keep command bar open to show success/error
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeCommandBar();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  if (!isCommandBarOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center pt-32 z-50"
      onClick={closeCommandBar}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-100">
              AI Canvas Command
            </h2>
            <button
              onClick={closeCommandBar}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
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
          <p className="text-sm text-gray-400 mt-1">
            Describe what you want to create or modify on the canvas
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Create a blue rectangle at 100, 100..."
            className="w-full px-4 py-3 text-lg bg-gray-900 border-2 border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isProcessing}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-3 px-4 py-2 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Progress Display */}
          {isProcessing && progress && (
            <div className="mt-3 px-4 py-3 bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-300">
                  Processing batch {progress.batchNumber}...
                </span>
                <span className="text-sm text-blue-400">
                  {progress.current} operations
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((progress.current / progress.total) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 text-gray-300 rounded">↑</kbd> / <kbd className="px-2 py-1 bg-gray-900 border border-gray-700 text-gray-300 rounded">↓</kbd> for history
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeCommandBar}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
                disabled={!input.trim() || isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Execute'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-900 bg-opacity-50">
            <p className="text-sm font-medium text-gray-300 mb-2">Recent commands:</p>
            <div className="space-y-1">
              {commandHistory.slice(0, 5).map((cmd, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-400 hover:text-blue-400 hover:bg-gray-800 cursor-pointer px-3 py-2 rounded transition-colors truncate"
                  onClick={() => {
                    setInput(cmd);
                    setHistoryIndex(i);
                  }}
                  title={cmd}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example Commands (shown when no history) */}
        {commandHistory.length === 0 && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-900 bg-opacity-50">
            <p className="text-sm font-medium text-gray-300 mb-2">Try these commands:</p>
            <div className="space-y-1">
              {EXAMPLE_COMMANDS.map((cmd, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-400 hover:text-blue-400 hover:bg-gray-800 cursor-pointer px-3 py-2 rounded transition-colors truncate"
                  onClick={() => setInput(cmd)}
                  title={cmd}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


