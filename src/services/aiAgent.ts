import { auth } from './firebase';

/**
 * AI Agent Service
 * Communicates with AWS Lambda backend to execute AI canvas commands
 */

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://YOUR-API-GATEWAY-URL.execute-api.us-east-1.amazonaws.com/ai/command';

export interface ToolCall {
  type: string;
  function: {
    name: string;
    arguments: any;
  };
}

export interface AICommandResponse {
  toolCalls: ToolCall[];
  totalOperations: number;
  batchNumber: number;
  hasMore: boolean;
  message?: string;
  latency: number;
  timestamp: number;
  cached?: boolean;
}

export interface CanvasState {
  shapes: any[];
  selection: string[];
}

/**
 * Send command to AI agent backend (AWS Lambda)
 * @param command - Natural language command
 * @param canvasState - Current canvas state
 * @returns Tool calls to execute and metadata
 */
export async function sendCommandToAI(
  command: string,
  canvasState: CanvasState
): Promise<AICommandResponse> {
  // Generate unique request ID for idempotency
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

  // Get Firebase ID token
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated. Please log in.');
  }

  let idToken: string;
  try {
    idToken = await currentUser.getIdToken();
  } catch (error: any) {
    throw new Error(`Failed to get authentication token: ${error.message}`);
  }

  // Call AWS Lambda via API Gateway
  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command,
        canvasState,
        requestId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 400) {
        throw new Error(errorData.message || 'Invalid command. Please try rephrasing.');
      } else {
        throw new Error(errorData.message || `AI command failed (${response.status})`);
      }
    }

    const data: AICommandResponse = await response.json();
    return data;
  } catch (error: any) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
}

/**
 * Execute tool calls on canvas
 * @param toolCalls - Array of tool calls from AI
 * @param canvasContext - Canvas context with methods
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  canvasContext: any
): Promise<void> {
  console.log(`Executing ${toolCalls.length} tool calls...`);

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;

    try {
      console.log(`Executing tool: ${name}`, args);

      switch (name) {
        case 'createShape':
          const shapeData: any = {
            type: args.type,
            x: args.x,
            y: args.y,
            width: args.width,
            height: args.height,
            fill: args.fill || '#3B82F6',
          };
          // Only add stroke if it's defined
          if (args.stroke) {
            shapeData.stroke = args.stroke;
          }
          await canvasContext.addShape(shapeData);
          break;

        case 'moveShape':
          await canvasContext.updateShape(args.id, {
            x: args.x,
            y: args.y,
          });
          break;

        case 'resizeShape':
          await canvasContext.updateShape(args.id, {
            width: args.width,
            height: args.height,
          });
          break;

        case 'rotateShape':
          await canvasContext.updateShape(args.id, {
            rotation: args.degrees,
          });
          break;

        case 'align':
          // alignShapes expects array of shape objects, not just IDs
          // We need to find the shapes by ID first
          const shapesToAlign = args.ids
            .map((id: string) => canvasContext.shapes.find((s: any) => s.id === id))
            .filter(Boolean);
          
          if (shapesToAlign.length > 0) {
            await canvasContext.alignShapes(shapesToAlign, args.mode);
          }
          break;

        case 'distribute':
          // distributeShapes expects array of shape objects
          const shapesToDistribute = args.ids
            .map((id: string) => canvasContext.shapes.find((s: any) => s.id === id))
            .filter(Boolean);
          
          if (shapesToDistribute.length >= 2) {
            await canvasContext.distributeShapes(shapesToDistribute, args.axis);
          }
          break;

        case 'createText':
          await canvasContext.addShape({
            type: 'text',
            x: args.x,
            y: args.y,
            text: args.text,
            fontSize: args.fontSize || 16,
            fill: args.fill || '#000000',
            fontFamily: args.fontFamily || 'Arial',
            fontStyle: `${args.bold ? 'bold ' : ''}${args.italic ? 'italic' : ''}`.trim() || 'normal',
          });
          break;

        case 'makeComponent':
          // TODO: Implement components system (PR #15-17)
          console.warn('makeComponent not yet implemented');
          break;

        case 'instantiateComponent':
          // TODO: Implement components system (PR #15-17)
          console.warn('instantiateComponent not yet implemented');
          break;

        case 'export':
          // TODO: Trigger export functionality
          console.log('Export requested:', args.scope, args.format);
          break;

        case 'bulkCreateShapes':
          // Efficiently create many shapes from pre-computed coordinates
          console.log(`Bulk creating ${args.count} shapes...`);
          
          const bulkShapesData = args.shapes.map((shape: any) => {
            const shapeData: any = {
              type: shape.type,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              fill: shape.fill || '#3B82F6',
            };
            if (shape.stroke) {
              shapeData.stroke = shape.stroke;
            }
            if (shape.rotation) {
              shapeData.rotation = shape.rotation;
            }
            return shapeData;
          });
          
          // Single Firestore write for all shapes
          await canvasContext.bulkAddShapes(bulkShapesData);
          
          console.log(`✅ Bulk created ${args.count} shapes in Firestore`);
          break;

        case 'createComplexLayout':
          // Create complex layout from pre-computed elements
          console.log(`Creating ${args.type} layout with ${args.count} elements...`);
          
          const layoutShapesData = args.shapes.map((shape: any) => {
            const shapeData: any = {
              type: shape.type,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              fill: shape.fill || '#3B82F6',
            };
            
            // Add text-specific properties
            if (shape.text) {
              shapeData.text = shape.text;
              shapeData.fontSize = shape.fontSize || 16;
            }
            
            // Add stroke if defined
            if (shape.stroke) {
              shapeData.stroke = shape.stroke;
            }
            
            return shapeData;
          });
          
          // Single Firestore write for all shapes
          await canvasContext.bulkAddShapes(layoutShapesData);
          
          console.log(`✅ Created ${args.type} layout with ${args.count} elements in Firestore`);
          break;

        default:
          console.warn(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      console.error(`Error executing tool ${name}:`, error);
      throw new Error(`Failed to execute ${name}: ${error.message}`);
    }
  }

  console.log('All tool calls executed successfully');
}


