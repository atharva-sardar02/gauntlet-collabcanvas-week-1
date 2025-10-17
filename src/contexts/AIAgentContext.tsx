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

    try {
      console.log('Executing AI command:', command);

      // Build canvas state
      const canvasState = {
        shapes: canvasContext.shapes || [],
        selection: canvasContext.selectedShapeIds || [],
      };

      // Send to AI backend
      const { toolCalls, latency, cached } = await sendCommandToAI(command, canvasState);
      
      console.log(
        `AI responded in ${latency}ms${cached ? ' (cached)' : ''} with ${toolCalls.length} tool calls`
      );

      if (toolCalls.length === 0) {
        setError('AI could not understand the command. Please try rephrasing.');
        return;
      }

      // Execute tool calls on canvas
      await executeToolCalls(toolCalls, canvasContext);

      // Add to history
      setCommandHistory((prev) => {
        const updated = [command, ...prev];
        return updated.slice(0, 10); // Keep last 10 commands
      });

      // Show success (you can add toast notification here)
      console.log(`✅ Successfully executed ${toolCalls.length} operations`);

    } catch (error: any) {
      console.error('AI command failed:', error);
      setError(error.message || 'Failed to execute command');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AIAgentContext.Provider
      value={{
        isCommandBarOpen,
        commandHistory,
        isProcessing,
        error,
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


