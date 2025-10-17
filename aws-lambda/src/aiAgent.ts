import { ChatOpenAI } from '@langchain/openai';
import { toolSchemas } from './schemas/tools';

/**
 * AI Canvas Agent
 * Uses LangChain + OpenAI to execute natural language canvas commands
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

/**
 * Execute AI canvas command
 * @param commandText - Natural language command from user
 * @param canvasState - Current canvas state (shapes, selection)
 * @param openaiApiKey - OpenAI API key
 * @returns Array of tool calls to execute on frontend
 */
export async function executeAICommand(
  commandText: string,
  canvasState: CanvasState,
  openaiApiKey: string
): Promise<ToolCall[]> {
  console.log('Executing AI command:', commandText);
  console.log('Canvas state:', {
    shapesCount: canvasState.shapes?.length || 0,
    selectionCount: canvasState.selection?.length || 0,
  });

  // Initialize OpenAI model with function calling
  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',  // Fast and cost-effective
    temperature: 0,  // Deterministic outputs
    openAIApiKey: openaiApiKey,
  });

  // Define tools for OpenAI function calling
  const tools = [
    {
      type: 'function',
      function: {
        name: 'createShape',
        description: 'Creates a new shape on the canvas (rectangle, circle, triangle, or star). Use this when user wants to create or add shapes.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['rectangle', 'circle', 'triangle', 'star'],
              description: 'Type of shape to create',
            },
            x: {
              type: 'number',
              description: 'X position (top-left corner) in pixels',
            },
            y: {
              type: 'number',
              description: 'Y position (top-left corner) in pixels',
            },
            width: {
              type: 'number',
              description: 'Width in pixels',
            },
            height: {
              type: 'number',
              description: 'Height in pixels',
            },
            fill: {
              type: 'string',
              description: 'Fill color in hex format (e.g., #3B82F6)',
            },
            stroke: {
              type: 'string',
              description: 'Stroke color in hex format (optional)',
            },
          },
          required: ['type', 'x', 'y', 'width', 'height'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'moveShape',
        description: 'Moves an existing shape to a new position. Requires shape ID.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of shape to move',
            },
            x: {
              type: 'number',
              description: 'New X position',
            },
            y: {
              type: 'number',
              description: 'New Y position',
            },
          },
          required: ['id', 'x', 'y'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'resizeShape',
        description: 'Changes the dimensions of an existing shape. Requires shape ID.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of shape to resize',
            },
            width: {
              type: 'number',
              description: 'New width in pixels',
            },
            height: {
              type: 'number',
              description: 'New height in pixels',
            },
          },
          required: ['id', 'width', 'height'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'rotateShape',
        description: 'Rotates an existing shape by the specified angle. Requires shape ID.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of shape to rotate',
            },
            degrees: {
              type: 'number',
              description: 'Rotation angle in degrees',
            },
          },
          required: ['id', 'degrees'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'align',
        description: 'Aligns multiple shapes relative to each other. Requires at least 1 shape.',
        parameters: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of shape IDs to align',
            },
            mode: {
              type: 'string',
              enum: ['left', 'right', 'top', 'bottom', 'center-h', 'center-v'],
              description: 'Alignment mode',
            },
          },
          required: ['ids', 'mode'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'distribute',
        description: 'Distributes multiple shapes evenly along an axis. Requires at least 2 shapes.',
        parameters: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of shape IDs to distribute (minimum 2)',
            },
            axis: {
              type: 'string',
              enum: ['horizontal', 'vertical'],
              description: 'Distribution axis',
            },
          },
          required: ['ids', 'axis'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createText',
        description: 'Creates a text element on the canvas. Use this for labels, headings, or any text content.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text content to display',
            },
            x: {
              type: 'number',
              description: 'X position in pixels',
            },
            y: {
              type: 'number',
              description: 'Y position in pixels',
            },
            fontSize: {
              type: 'number',
              description: 'Font size in pixels (default: 16)',
            },
            fill: {
              type: 'string',
              description: 'Text color in hex format (default: #000000)',
            },
            bold: {
              type: 'boolean',
              description: 'Bold text (default: false)',
            },
            italic: {
              type: 'boolean',
              description: 'Italic text (default: false)',
            },
          },
          required: ['text', 'x', 'y'],
        },
      },
    },
  ];

  // System prompt for canvas operations
  const systemPrompt = `You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas.

Current canvas state:
- Total shapes: ${canvasState.shapes?.length || 0}
- Selected shapes: ${canvasState.selection?.length || 0}
- Canvas size: 5000x5000 pixels
- Visible viewport: typically 1920x1080 pixels

Guidelines for creating layouts:
1. **Positioning**: Start elements at reasonable positions (100-500px from edges)
2. **Spacing**: Use consistent spacing between elements (20-40px for related items)
3. **Sizing**: 
   - Buttons: 100-150px wide, 35-45px tall
   - Input fields: 200-300px wide, 35-45px tall
   - Text labels: 12-16px font size
   - Headings: 18-24px font size
4. **Alignment**: Align related elements (use top/left/center alignment)
5. **Colors**: 
   - Buttons: #3B82F6 (blue), #10B981 (green), #EF4444 (red)
   - Inputs: #FFFFFF (white) with #000000 border
   - Text: #000000 (black) or #6B7280 (gray)
6. **Layout patterns**:
   - Login form: Vertical stack with labels above inputs
   - Navbar: Horizontal row with logo left, menu items right
   - Cards: Group related elements with consistent margins

When user asks for complex layouts (login form, navbar, etc.):
1. Break into individual elements (labels, inputs, buttons)
2. Calculate positions for neat vertical/horizontal arrangement
3. Create elements in logical order (top-to-bottom, left-to-right)

Available tools: createShape, moveShape, resizeShape, rotateShape, align, distribute, createText.

Return tool calls to execute the user's command. For complex commands, return multiple tool calls in sequence.`;

  try {
    // Call OpenAI with tools
    const response = await model.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: commandText },
      ],
      {
        tools: tools as any,
        tool_choice: 'auto',
      }
    );

    console.log('OpenAI response:', JSON.stringify(response, null, 2));

    // Extract tool calls from response
    const toolCalls: ToolCall[] = [];
    
    if (response.additional_kwargs?.tool_calls) {
      for (const toolCall of response.additional_kwargs.tool_calls) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          
          // Validate with Zod schema
          const schemaName = toolCall.function.name as keyof typeof toolSchemas;
          if (toolSchemas[schemaName]) {
            const validatedArgs = toolSchemas[schemaName].parse(args);
            
            toolCalls.push({
              type: 'function',
              function: {
                name: toolCall.function.name,
                arguments: validatedArgs,
              },
            });
          } else {
            console.warn(`Unknown tool: ${toolCall.function.name}`);
          }
        } catch (error: any) {
          console.error(`Invalid tool call arguments: ${error.message}`);
        }
      }
    }

    console.log(`Generated ${toolCalls.length} tool calls`);
    return toolCalls;
  } catch (error: any) {
    console.error('OpenAI API error:', error.message);
    throw new Error(`AI command failed: ${error.message}`);
  }
}


