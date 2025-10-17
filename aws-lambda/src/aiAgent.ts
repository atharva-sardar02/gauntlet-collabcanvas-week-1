import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { toolSchemas } from './schemas/tools';
import { executeBulkCreateShapes, executeCreateComplexLayout } from './executors/geometryExecutors';

/**
 * AI Canvas Agent with Multi-Step Reasoning
 * Uses LangChain AgentExecutor for iterative task execution
 */

export interface CanvasState {
  shapes: any[];
  selection: string[];
}

export interface ToolCall {
  type: string;
  function: {
    name: string;
    arguments: any;
  };
}

export interface AgentResponse {
  toolCalls: ToolCall[];
  totalOperations: number;
  batchNumber: number;
  hasMore: boolean;
  message?: string;
}

/**
 * Execute AI canvas command with agent loop
 * Supports multi-step reasoning and batching
 */
export async function executeAICommand(
  commandText: string,
  canvasState: CanvasState,
  openaiApiKey: string,
  batchSize: number = 50
): Promise<AgentResponse> {
  console.log('Executing AI command with agent loop:', commandText);
  console.log('Canvas state:', {
    shapesCount: canvasState.shapes?.length || 0,
    selectionCount: canvasState.selection?.length || 0,
  });

  // Initialize OpenAI model
  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
    openAIApiKey: openaiApiKey,
    maxTokens: 4000, // Allow longer responses
  });

  // Track tool calls for batching
  const collectedToolCalls: ToolCall[] = [];

  // Create tools for the agent
  const tools = [
    new DynamicStructuredTool({
      name: 'createShape',
      description: 'Creates a new shape on the canvas (rectangle, circle, triangle, or star). Call this multiple times to create multiple shapes.',
      schema: toolSchemas.createShape,
      func: async (input: any) => {
        // Collect tool call instead of executing
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'createShape',
            arguments: input,
          },
        });
        return `Shape ${collectedToolCalls.length} queued: ${input.type} at (${input.x}, ${input.y})`;
      },
    }),
    new DynamicStructuredTool({
      name: 'createText',
      description: 'Creates a text element on the canvas. Use this for labels, headings, or any text content.',
      schema: toolSchemas.createText,
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'createText',
            arguments: input,
          },
        });
        return `Text queued: "${input.text}" at (${input.x}, ${input.y})`;
      },
    }),
    new DynamicStructuredTool({
      name: 'moveShape',
      description: 'Moves an existing shape to a new position. Requires shape ID.',
      schema: toolSchemas.moveShape,
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'moveShape',
            arguments: input,
          },
        });
        return `Shape move queued: ${input.id} to (${input.x}, ${input.y})`;
      },
    }),
    new DynamicStructuredTool({
      name: 'align',
      description: 'Aligns multiple shapes relative to each other.',
      schema: toolSchemas.align,
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'align',
            arguments: input,
          },
        });
        return `Align queued: ${input.ids.length} shapes, mode: ${input.mode}`;
      },
    }),
    new DynamicStructuredTool({
      name: 'bulkCreateShapes',
      description: 'EFFICIENT bulk shape creation - Use this for creating 10+ shapes in patterns (grid, row, column, circle, spiral). Creates up to 1000 shapes in <10ms. This is MUCH FASTER than calling createShape multiple times.',
      schema: toolSchemas.bulkCreateShapes,
      func: async (input: any) => {
        // Execute geometry computation immediately
        const computedShapes = executeBulkCreateShapes(input);
        
        // Queue as bulk operation
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'bulkCreateShapes',
            arguments: {
              pattern: input.pattern,
              shapes: computedShapes,
              count: computedShapes.length,
            },
          },
        });
        
        return `Bulk created ${computedShapes.length} ${input.shape}s in ${input.pattern} pattern. Ready to render.`;
      },
    }),
    new DynamicStructuredTool({
      name: 'createComplexLayout',
      description: 'Creates complex UI layouts with multiple elements (login_form, navbar, card, button_group, form, dashboard). Use this for structured multi-element designs.',
      schema: toolSchemas.createComplexLayout,
      func: async (input: any) => {
        // Execute geometry computation immediately
        const computedShapes = executeCreateComplexLayout(input);
        
        // Queue as bulk operation
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'createComplexLayout',
            arguments: {
              type: input.type,
              shapes: computedShapes,
              count: computedShapes.length,
            },
          },
        });
        
        return `Created ${input.type} layout with ${computedShapes.length} elements. Ready to render.`;
      },
    }),
  ];

  // Create agent prompt with instructions
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an AI assistant that creates and manipulates shapes on a collaborative canvas.

**Canvas State**:
- Total shapes: {shapesCount}
- Selected shapes: {selectionCount}
- Canvas size: 5000x5000 pixels

**Important Instructions**:
1. For creating multiple shapes (grids, layouts, etc.), call the tools multiple times
2. Calculate positions systematically (e.g., grid: 10 shapes per row with 50px spacing)
3. For "create 500 shapes", call createShape 500 times with calculated positions
4. Use consistent spacing and alignment for visual appeal
5. Default sizes: rectangles 100x80, circles 60x60, text 16px

**Common Patterns**:
- Grid: Calculate rows/cols, space evenly (e.g., 20x25 for 500 shapes)
- Form: Stack vertically with 20px spacing
- Navbar: Arrange horizontally with 30px spacing

**Available Tools**:
- createShape: For 1-10 individual shapes
- bulkCreateShapes: For 10+ shapes in patterns (MUCH FASTER - use this for grids, rows, etc.)
- createComplexLayout: For UI components (forms, navbars, cards)
- createText: For text elements
- moveShape: For repositioning
- align: For alignment

**IMPORTANT**: For commands like "create 50 circles" or "create 500 rectangles", ALWAYS use bulkCreateShapes with pattern='grid'. DO NOT call createShape 500 times!

Call tools to complete the task efficiently.`,
    ],
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ]);

  try {
    // Create agent
    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt,
    });

    // Create executor with high iteration limit
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      maxIterations: batchSize, // Limit iterations per batch
      returnIntermediateSteps: true,
      verbose: false,
    });

    // Execute agent
    const startTime = Date.now();
    const result = await agentExecutor.invoke({
      input: commandText,
      shapesCount: canvasState.shapes?.length || 0,
      selectionCount: canvasState.selection?.length || 0,
    });

    const executionTime = Date.now() - startTime;

    console.log(`Agent executed in ${executionTime}ms`);
    console.log(`Collected ${collectedToolCalls.length} tool calls`);
    console.log(`Agent output: ${result.output}`);

    // Determine if more iterations needed
    const hasMore = collectedToolCalls.length >= batchSize;

    return {
      toolCalls: collectedToolCalls,
      totalOperations: collectedToolCalls.length,
      batchNumber: 1,
      hasMore,
      message: result.output,
    };
  } catch (error: any) {
    console.error('Agent execution error:', error.message);
    
    // If we collected some tool calls before error, return them
    if (collectedToolCalls.length > 0) {
      return {
        toolCalls: collectedToolCalls,
        totalOperations: collectedToolCalls.length,
        batchNumber: 1,
        hasMore: false,
        message: `Partial completion: ${collectedToolCalls.length} operations queued`,
      };
    }
    
    throw new Error(`AI agent failed: ${error.message}`);
  }
}
