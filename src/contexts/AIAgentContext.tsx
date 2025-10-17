import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { sendCommandToAI, executeToolCalls } from '../services/aiAgent';

/**
 * AI Agent Context
 * Manages AI command bar state and execution
 */

interface AIAgentContextType {
  isCommandBarOpen: boolean;
  commandHistory: string[];
  isProcessing: boolean;
  error: string | null;
  progress: {
    current: number;
    total: number;
    batchNumber: number;
  } | null;
  openCommandBar: () => void;
  closeCommandBar: () => void;
  executeCommand: (command: string) => Promise<void>;
}

const AIAgentContext = createContext<AIAgentContextType | undefined>(undefined);

export function AIAgentProvider({ children }: { children: ReactNode }) {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; batchNumber: number } | null>(null);
  const canvasContext = useCanvas();

  const openCommandBar = () => {
    setIsCommandBarOpen(true);
    setError(null);
  };

  const closeCommandBar = () => {
    setIsCommandBarOpen(false);
    setError(null);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) {
      setError('Please enter a command');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(null);

    try {
      console.log('Executing AI command with agent loop:', command);

      let totalExecuted = 0;
      let batchNumber = 1;
      let hasMore = true;

      // Build canvas state
      const canvasState = {
        shapes: canvasContext.shapes || [],
        selection: canvasContext.selectedShapeIds || [],
      };

      // Process batches until complete
      while (hasMore) {
        console.log(`Processing batch ${batchNumber}...`);

        // Send to AI backend
        const response = await sendCommandToAI(command, canvasState);
        
        console.log(
          `Batch ${batchNumber}: ${response.toolCalls.length} tool calls in ${response.latency}ms${response.cached ? ' (cached)' : ''}`
        );

        if (response.toolCalls.length === 0) {
          setError('AI could not understand the command. Please try rephrasing.');
          return;
        }

        // Update progress
        totalExecuted += response.toolCalls.length;
        setProgress({
          current: totalExecuted,
          total: response.hasMore ? totalExecuted + 50 : totalExecuted, // Estimate
          batchNumber: response.batchNumber,
        });

        // Execute tool calls on canvas
        await executeToolCalls(response.toolCalls, canvasContext);

        // Check if more batches needed
        hasMore = response.hasMore;
        batchNumber++;

        // Safety limit: max 10 batches (500 operations)
        if (batchNumber > 10) {
          console.warn('Reached maximum batch limit (10 batches)');
          hasMore = false;
        }
      }

      // Add to history
      setCommandHistory((prev) => {
        const updated = [command, ...prev];
        return updated.slice(0, 10); // Keep last 10 commands
      });

      // Show success
      console.log(`✅ Successfully executed ${totalExecuted} operations in ${batchNumber - 1} batches`);

      // Navigate to created shapes
      if (canvasContext.shapes.length > 0) {
        // Get the last shapes that were created (rough estimate based on total executed)
        const recentShapes = canvasContext.shapes.slice(-Math.min(totalExecuted, 50));
        
        if (recentShapes.length > 0) {
          // Calculate bounding box of created shapes
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          
          recentShapes.forEach(shape => {
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + (shape.width || 0));
            maxY = Math.max(maxY, shape.y + (shape.height || 0));
          });
          
          // Center point of created shapes
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          
          console.log(`📍 Navigating to created shapes at (${Math.round(centerX)}, ${Math.round(centerY)})`);
          
          // Trigger canvas pan (this will be handled by the browser's scroll behavior)
          // Since we don't have direct access to stage, we'll use a custom event
          window.dispatchEvent(new CustomEvent('panToLocation', { 
            detail: { x: centerX, y: centerY } 
          }));
        }
      }

      // Close command bar after successful execution
      setTimeout(() => {
        closeCommandBar();
      }, 800); // Slightly longer delay to show success and allow pan

    } catch (error: any) {
      console.error('AI command failed:', error);
      setError(error.message || 'Failed to execute command');
      // Don't close on error - let user see the error message
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <AIAgentContext.Provider
      value={{
        isCommandBarOpen,
        commandHistory,
        isProcessing,
        error,
        progress,
        openCommandBar,
        closeCommandBar,
        executeCommand,
      }}
    >
      {children}
    </AIAgentContext.Provider>
  );
}

/**
 * Hook to use AI Agent context
 */
export function useAIAgent() {
  const context = useContext(AIAgentContext);
  if (!context) {
    throw new Error('useAIAgent must be used within AIAgentProvider');
  }
  return context;
}


