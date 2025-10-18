import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../../contexts/AIAgentContext';

/**
 * AI Command Bar Component
 * Modal overlay with text input for AI commands
 * Opens with Ctrl+/ keyboard shortcut
 */

const EXAMPLE_COMMANDS = [
  // Creation Commands
  'Create a red circle at position 100, 200',
  'Add a text layer that says "Hello World"',
  'Make a 200x300 rectangle',
  // Manipulation Commands
  'Move the blue rectangle to the center',
  'Resize the circle to be twice as big',
  'Rotate the text 45 degrees',
  // Layout Commands
  'Arrange these shapes in a horizontal row',
  'Create a grid of 3x3 squares',
  'Space these elements evenly',
  // Complex Commands
  'Create a login form with username and password fields',
  'Build a navigation bar with 4 menu items',
  'Make a card layout with title, image, and description',
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

        {/* Two-Column Layout: Command Library (Left) + Recent History (Right) */}
        <div className="border-t border-gray-700 bg-gray-900">
          <div className="grid grid-cols-2 divide-x divide-gray-700">
            
            {/* LEFT: Command Library */}
            <div className="px-5 py-4 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm font-semibold text-gray-200">Command Library</p>
              </div>
              
              {/* Creation Commands */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5 px-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                  <p className="text-xs font-medium text-blue-300 uppercase tracking-wide">Creation</p>
                </div>
                <div className="space-y-0.5">
                  {EXAMPLE_COMMANDS.slice(0, 3).map((cmd, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 hover:text-blue-300 hover:bg-gray-800 cursor-pointer px-2.5 py-2 rounded-md transition-all"
                      onClick={() => setInput(cmd)}
                      title={cmd}
                    >
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>

              {/* Manipulation Commands */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5 px-2">
                  <div className="w-1 h-1 rounded-full bg-green-400"></div>
                  <p className="text-xs font-medium text-green-300 uppercase tracking-wide">Manipulation</p>
                </div>
                <div className="space-y-0.5">
                  {EXAMPLE_COMMANDS.slice(3, 6).map((cmd, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 hover:text-green-300 hover:bg-gray-800 cursor-pointer px-2.5 py-2 rounded-md transition-all"
                      onClick={() => setInput(cmd)}
                      title={cmd}
                    >
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>

              {/* Layout Commands */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5 px-2">
                  <div className="w-1 h-1 rounded-full bg-yellow-400"></div>
                  <p className="text-xs font-medium text-yellow-300 uppercase tracking-wide">Layout</p>
                </div>
                <div className="space-y-0.5">
                  {EXAMPLE_COMMANDS.slice(6, 9).map((cmd, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 hover:text-yellow-300 hover:bg-gray-800 cursor-pointer px-2.5 py-2 rounded-md transition-all"
                      onClick={() => setInput(cmd)}
                      title={cmd}
                    >
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>

              {/* Complex Commands */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 px-2">
                  <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                  <p className="text-xs font-medium text-purple-300 uppercase tracking-wide">Complex</p>
                </div>
                <div className="space-y-0.5">
                  {EXAMPLE_COMMANDS.slice(9, 12).map((cmd, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 hover:text-purple-300 hover:bg-gray-800 cursor-pointer px-2.5 py-2 rounded-md transition-all"
                      onClick={() => setInput(cmd)}
                      title={cmd}
                    >
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Recent History */}
            <div className="px-5 py-4 max-h-96 overflow-y-auto custom-scrollbar bg-gray-900 bg-opacity-40">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-gray-200">Recent History</p>
              </div>
              {commandHistory.length > 0 ? (
                <div className="space-y-0.5">
                  {commandHistory.slice(0, 10).map((cmd, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 hover:text-blue-300 hover:bg-gray-800 cursor-pointer px-2.5 py-2 rounded-md transition-all group"
                      onClick={() => {
                        setInput(cmd);
                        setHistoryIndex(i);
                      }}
                      title={cmd}
                    >
                      <span className="text-gray-600 group-hover:text-gray-500 mr-2">#{i + 1}</span>
                      {cmd}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-xs text-gray-500">No history yet</p>
                  <p className="text-xs text-gray-600 mt-1">Try a command from the library</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


