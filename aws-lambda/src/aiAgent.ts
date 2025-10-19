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
    modelName: 'gpt-4o-mini',  // Better reasoning for complex layouts and color matching
    temperature: 0,
    openAIApiKey: openaiApiKey,
    maxTokens: 4000, // Allow longer responses
  });

  // Track tool calls for batching
  const collectedToolCalls: ToolCall[] = [];

  // Create tools for the agent
  const tools = [
    new DynamicStructuredTool({
      name: 'getShapes',
      description: 'Query existing shapes on the canvas. Returns list of shapes with their IDs, types, colors, and positions. Use this FIRST before moving/resizing/rotating shapes.',
      schema: toolSchemas.getShapes || require('zod').z.object({
        filter: require('zod').z.object({
          type: require('zod').z.enum(['rectangle', 'circle', 'triangle', 'star', 'text']).optional(),
          fill: require('zod').z.string().optional(),
        }).optional(),
      }),
      func: async (input: any) => {
        // Return current shapes from canvas state
        let filteredShapes = canvasState.shapes || [];
        
        if (input?.filter?.type) {
          filteredShapes = filteredShapes.filter((s: any) => s.type === input.filter.type);
        }
        if (input?.filter?.fill) {
          // Support color keywords - map to common hex codes
          const colorMap: any = {
            'red': ['#EF4444', '#DC2626', '#B91C1C', '#FF0000', '#F87171', '#EF4444FF'],
            'blue': ['#3B82F6', '#2563EB', '#1D4ED8', '#0000FF', '#60A5FA', '#3B82F6FF'],
            'green': ['#10B981', '#059669', '#047857', '#00FF00', '#34D399', '#10B981FF'],
            'yellow': ['#F59E0B', '#D97706', '#B45309', '#FFFF00', '#FBBF24', '#F59E0BFF'],
            'purple': ['#8B5CF6', '#7C3AED', '#6D28D9', '#A855F7', '#8B5CF6FF'],
            'pink': ['#EC4899', '#DB2777', '#BE185D', '#F472B6', '#EC4899FF'],
            'orange': ['#F97316', '#EA580C', '#C2410C', '#FB923C', '#F97316FF'],
            'gray': ['#6B7280', '#4B5563', '#374151', '#9CA3AF', '#6B7280FF'],
            'grey': ['#6B7280', '#4B5563', '#374151', '#9CA3AF', '#6B7280FF'], // British spelling
            'black': ['#000000', '#111827', '#1F2937', '#000000FF'],
            'white': ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#FFFFFFFF'],
          };
          
          const searchColor = input.filter.fill.toLowerCase();
          
          // Check if it's a color keyword
          if (colorMap[searchColor]) {
            filteredShapes = filteredShapes.filter((s: any) => {
              if (!s.fill) return false;
              const shapeFill = s.fill.toUpperCase().replace(/\s/g, '');
              
              // Check exact match or starts with (for alpha channel)
              const exactMatch = colorMap[searchColor].some((hex: string) => {
                const cleanHex = hex.toUpperCase().replace(/\s/g, '');
                return shapeFill === cleanHex || shapeFill.startsWith(cleanHex);
              });
              
              if (exactMatch) return true;
              
              // Also check if the color name is in the fill (e.g., "blue" in fill string)
              if (s.fill.toLowerCase().includes(searchColor)) return true;
              
              return false;
            });
          } else {
            // Otherwise do substring match (for hex codes)
            filteredShapes = filteredShapes.filter((s: any) => 
              s.fill?.toLowerCase().includes(searchColor)
            );
          }
          
          console.log(`Filter by color "${input.filter.fill}": found ${filteredShapes.length} shapes out of ${canvasState.shapes?.length || 0} total`);
        }
        
        const summary = filteredShapes.map((s: any) => ({
          id: s.id,
          type: s.type,
          fill: s.fill,
          x: Math.round(s.x),
          y: Math.round(s.y),
          width: Math.round(s.width),
          height: Math.round(s.height),
        }));
        
        return `Found ${summary.length} shape(s): ${JSON.stringify(summary)}`;
      },
    }),
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
      description: 'Moves an existing shape to a new position. Use getShapes first to find the shape ID. Requires shape ID.',
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
      name: 'resizeShape',
      description: 'Resizes an existing shape. Use getShapes first to find the shape ID. Requires shape ID and new dimensions.',
      schema: toolSchemas.resizeShape,
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'resizeShape',
            arguments: input,
          },
        });
        return `Shape resize queued: ${input.id} to ${input.width}x${input.height}`;
      },
    }),
    new DynamicStructuredTool({
      name: 'rotateShape',
      description: 'Rotates an existing shape by degrees. Use getShapes first to find the shape ID. Requires shape ID and rotation angle.',
      schema: toolSchemas.rotateShape,
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'rotateShape',
            arguments: input,
          },
        });
        return `Shape rotation queued: ${input.id} by ${input.degrees} degrees`;
      },
    }),
    new DynamicStructuredTool({
      name: 'updateShape',
      description: 'Updates properties of an existing shape (color, opacity, blend mode). Use getShapes first to find the shape ID.',
      schema: toolSchemas.updateShape,
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'updateShape',
            arguments: input,
          },
        });
        return `Shape update queued: ${input.id}`;
      },
    }),
    new DynamicStructuredTool({
      name: 'deleteShape',
      description: 'Deletes an existing shape from the canvas. Use getShapes first to find the shape ID. Can delete multiple shapes by calling this multiple times.',
      schema: require('zod').z.object({
        id: require('zod').z.string().describe('Shape ID to delete'),
      }),
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'deleteShape',
            arguments: input,
          },
        });
        return `Shape deletion queued: ${input.id}`;
      },
    }),
    new DynamicStructuredTool({
      name: 'align',
      description: 'Aligns multiple EXISTING shapes relative to each other. Use getShapes first to find shape IDs.',
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
      name: 'distribute',
      description: 'Distributes multiple EXISTING shapes evenly (horizontally or vertically). Use getShapes first to find shape IDs. Use this for "space evenly", "arrange in a row", etc.',
      schema: toolSchemas.distribute,
      func: async (input: any) => {
        collectedToolCalls.push({
          type: 'function',
          function: {
            name: 'distribute',
            arguments: input,
          },
        });
        return `Distribute queued: ${input.ids.length} shapes, axis: ${input.axis}`;
      },
    }),
    new DynamicStructuredTool({
      name: 'bulkCreateShapes',
      description: 'EFFICIENT bulk shape creation - Use this for creating 10+ shapes in patterns (grid, row, column, circle, spiral). Creates up to 2000 shapes in <10ms. This is MUCH FASTER than calling createShape multiple times.',
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
- Canvas size: Infinite (no boundaries)

**CRITICAL WORKFLOW FOR MODIFYING EXISTING SHAPES**:
1. **ALWAYS call getShapes FIRST** to find existing shapes before moving/resizing/rotating/arranging
2. Use filters to find specific shapes: type (rectangle/circle/etc.) or fill color (blue/red/etc.)
3. Extract the shape IDs from the getShapes response
4. Then call moveShape/resizeShape/rotateShape/updateShape/align/distribute with those IDs

**Example Workflows**:

User: "Move the blue rectangle to the center"
1. Call getShapes with filter: {{type: "rectangle", fill: "blue"}}
2. Get response: "Found 1 shape(s): [{{"id":"shape-123","type":"rectangle","fill":"#0000FF",...}}]"
3. Call moveShape with id: "shape-123", x: 2500, y: 2500

User: "Resize the circle to be twice as big"
1. Call getShapes with filter: {{type: "circle"}}
2. Get current dimensions (e.g., width: 60, height: 60)
3. Call resizeShape with id and doubled dimensions (width: 120, height: 120)

User: "Rotate the circle by 45 degrees"
1. Call getShapes with filter: {{type: "circle"}}
2. Call rotateShape with the ID and degrees: 45

User: "Arrange these shapes in a horizontal row"
1. Call getShapes (no filter ONLY if there are less than 20 shapes total)
2. If there are many shapes, ask user to be more specific OR only arrange top-level shapes (skip text/labels)
3. Extract shape IDs from response
4. Call distribute with ids array and axis: "horizontal"

User: "Space these elements evenly"
1. Call getShapes (be smart about filtering - if there are 50+ shapes, only get rectangles/circles, not text)
2. Extract shape IDs from response  
3. Call distribute with ids array and appropriate axis (horizontal or vertical based on context)

**Available Tools**:
- **getShapes**: Query existing shapes (ALWAYS USE THIS FIRST for modifications/arrangements)
- **createShape**: For 1-10 individual NEW shapes
- **bulkCreateShapes**: For 10+ NEW shapes in patterns (MUCH FASTER - use for grids, rows)
- **createComplexLayout**: For UI components (forms, navbars, cards)
- **createText**: For NEW text elements
- **moveShape**: For repositioning EXISTING shapes (requires shape ID from getShapes)
- **resizeShape**: For resizing EXISTING shapes (requires shape ID from getShapes)
- **rotateShape**: For rotating EXISTING shapes (requires shape ID from getShapes)
- **updateShape**: For changing color/opacity/blend mode of EXISTING shapes (requires ID)
- **deleteShape**: For deleting EXISTING shapes (requires shape ID from getShapes)
- **align**: For aligning multiple EXISTING shapes (requires IDs from getShapes)
- **distribute**: For spacing EXISTING shapes evenly (requires IDs from getShapes)

**Common Patterns**:
- Create grid: Use bulkCreateShapes with pattern='grid'
- Arrange existing shapes: Use getShapes + distribute with axis='horizontal' or 'vertical'
- Space evenly: Use getShapes + distribute
- Move to center: x=2500, y=2500 (rough center)
- Resize 2x: multiply current width and height by 2

**Complex Layout Guidelines**:
- createComplexLayout automatically creates beautiful forms with:
  * Shadow background boxes for depth
  * Proper labels above input fields
  * Contrasting text colors (dark on light, white on dark buttons)
  * Professional spacing and sizing
- Text elements are automatically placed on top layer for visibility
- Button text is white (#FFFFFF) for contrast against colored buttons
- Input labels are dark gray (#374151) for readability

**CRITICAL DISTINCTIONS**:
- "Create shapes in a row" → Use bulkCreateShapes (NEW shapes)
- "Arrange these shapes in a row" → Use getShapes + distribute (EXISTING shapes)
- "Space these evenly" → Use getShapes + distribute (EXISTING shapes)
- "Rotate the circle" → Use getShapes + rotateShape (EXISTING shape)

**IMPORTANT**: 
- DO NOT create new shapes when asked to modify/arrange existing ones
- ALWAYS query first with getShapes before any move/resize/rotate/distribute operation
- For "create 50 circles", use bulkCreateShapes, NOT createShape 50 times
- For "arrange these shapes", use distribute, NOT bulkCreateShapes
- **CRITICAL**: When there are 50+ shapes (complex layouts like forms), DON'T arrange ALL of them!
  - If user says "arrange in a row" with a complex layout, respond: "There are many shapes. Which ones would you like to arrange?"
  - OR only arrange non-text shapes (filter out type='text')
  - Complex layouts (login forms, dashboards) should NOT be rearranged unless user is very specific

**HANDLING AMBIGUOUS/ABRUPT PROMPTS**:

**Interpret Natural Language Flexibly**:
- "make it bigger" → Call getShapes, find most recent shape, double its size
- "move it left" → Call getShapes, find most recent shape, subtract 100 from x
- "rotate it" → Call getShapes, find most recent shape, rotate 45 degrees (default)
- "delete everything" → Call getShapes, get all IDs, delete them
- "make them blue" → Call getShapes, get all IDs, updateShape with fill='#0000FF'

**Smart Defaults for Missing Information**:
- No position specified → Use (500, 500) as default starting position
- No color specified → Use blue (#3B82F6) for shapes, black (#000000) for text
- No size specified → Use 100x80 for rectangles, 60 radius for circles
- No angle specified → Use 45 degrees for rotation
- "bigger"/"smaller" without amount → Use 2x or 0.5x respectively
- "a few shapes" → Create 5 shapes
- "many shapes" → Create 20 shapes

**Ambiguous References Resolution**:
- "the shape" (singular, {shapesCount} > 1) → Find most recently created/modified shape
- "the shapes" (plural) → Get all shapes
- "the blue one" → Filter by color (blue, red, green, etc.)
- "the rectangle" → Filter by type
- "that thing" → Most recent shape
- "all of them" → All shapes

**Context Understanding**:
- "organize them" → Space evenly with distribute
- "clean it up" → Align and distribute shapes
- "make it nice" → Align shapes, add consistent spacing
- "fix the layout" → Distribute evenly, align to grid
- "center it" → Move to canvas center (2500, 2500)
- "bigger" → Increase by 2x
- "way bigger" → Increase by 3x-4x
- "a bit bigger" → Increase by 1.5x

**Color Keyword Mapping**:
- "red" → #EF4444, "blue" → #3B82F6, "green" → #10B981
- "yellow" → #F59E0B, "purple" → #8B5CF6, "pink" → #EC4899
- "orange" → #F97316, "gray" → #6B7280, "black" → #000000, "white" → #FFFFFF

**Action Verb Interpretation**:
- "spin/twist/turn" → rotate
- "expand/grow/enlarge" → resize bigger
- "shrink/reduce" → resize smaller
- "shift/slide/move" → moveShape
- "line up/straighten" → align
- "spread out" → distribute
- "stack" → align vertically with small spacing

**Error Recovery**:
- If getShapes returns 0 results and user asks to modify → Inform user "No shapes found"
- If multiple shapes match and command is singular → Use the most recent one
- If command is unclear → Use most logical interpretation based on canvas state
- If impossible request → Explain why and suggest alternative

**Handling Typos/Variations**:
- "recangle/reactangle" → rectangle
- "cirlce/circl" → circle
- "teh" → the
- "makee" → make
- Be flexible with spacing and punctuation

**Be Proactive**:
- If user says "create a form" → Use createComplexLayout with type='login_form'
- If user says "make a menu" → Use createComplexLayout with type='navbar'
- If user says "dashboard layout" → Use createComplexLayout with type='dashboard'

Call tools to complete the task efficiently. ALWAYS interpret user intent generously and intelligently, even with incomplete or abrupt commands.`,
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
