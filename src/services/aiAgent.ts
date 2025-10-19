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
 * @returns Array of affected shape coordinates for navigation
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  canvasContext: any
): Promise<{ x: number; y: number; width: number; height: number }[]> {
  console.log(`Executing ${toolCalls.length} tool calls...`);

  const affectedAreas: { x: number; y: number; width: number; height: number }[] = [];

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;

    try {
      console.log(`Executing tool: ${name}`, args);

      switch (name) {
        case 'getShapes':
          // This is a query tool used by the agent for reasoning
          // No action needed on frontend - it doesn't modify the canvas
          console.log('getShapes query executed by agent');
          break;

        case 'createShape':
          const shapeData: any = {
            type: args.type,
            x: args.x,
            y: args.y,
            width: args.width,
            height: args.height,
            fill: args.fill || '#3B82F6',
            opacity: args.opacity !== undefined ? args.opacity : 1,
            blendMode: args.blendMode || 'source-over',
          };
          // Only add stroke if it's defined
          if (args.stroke) {
            shapeData.stroke = args.stroke;
          }
          await canvasContext.addShape(shapeData);
          affectedAreas.push({ x: args.x, y: args.y, width: args.width, height: args.height });
          break;

        case 'moveShape':
          // Get current shape data before update
          const shapeToMove = canvasContext.shapes.find((s: any) => s.id === args.id);
          await canvasContext.updateShape(args.id, {
            x: args.x,
            y: args.y,
          });
          // Track new position with existing dimensions
          if (shapeToMove) {
            affectedAreas.push({ x: args.x, y: args.y, width: shapeToMove.width, height: shapeToMove.height });
          }
          break;

        case 'resizeShape':
          // Get current shape data before update
          const shapeToResize = canvasContext.shapes.find((s: any) => s.id === args.id);
          await canvasContext.updateShape(args.id, {
            width: args.width,
            height: args.height,
          });
          // Track with new dimensions
          if (shapeToResize) {
            affectedAreas.push({ x: shapeToResize.x, y: shapeToResize.y, width: args.width, height: args.height });
          }
          break;

        case 'rotateShape':
          // Get current shape data before update
          const shapeToRotate = canvasContext.shapes.find((s: any) => s.id === args.id);
          await canvasContext.updateShape(args.id, {
            rotation: args.degrees,
          });
          // Track current position
          if (shapeToRotate) {
            affectedAreas.push({ x: shapeToRotate.x, y: shapeToRotate.y, width: shapeToRotate.width, height: shapeToRotate.height });
          }
          break;

        case 'updateShape':
          // Update shape properties (color, opacity, blend mode, etc.)
          // Get current shape data before update
          const shapeToUpdate = canvasContext.shapes.find((s: any) => s.id === args.id);
          const updates: any = {};
          if (args.fill) updates.fill = args.fill;
          if (args.stroke) updates.stroke = args.stroke;
          if (args.opacity !== undefined) updates.opacity = args.opacity;
          if (args.blendMode) updates.blendMode = args.blendMode;
          await canvasContext.updateShape(args.id, updates);
          // Track current position
          if (shapeToUpdate) {
            affectedAreas.push({ x: shapeToUpdate.x, y: shapeToUpdate.y, width: shapeToUpdate.width, height: shapeToUpdate.height });
          }
          break;

        case 'deleteShape':
          // Delete an existing shape (don't track for navigation)
          await canvasContext.deleteShape(args.id);
          break;

        case 'align':
          // alignShapes expects array of shape IDs (not shape objects)
          if (args.ids.length > 0) {
            // Get shapes before aligning
            const shapesToAlign = args.ids.map((id: string) => canvasContext.shapes.find((s: any) => s.id === id)).filter(Boolean);
            await canvasContext.alignShapes(args.ids, args.mode);
            // Track all aligned shapes (use their current positions, they'll be updated)
            shapesToAlign.forEach((shape: any) => {
              affectedAreas.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
            });
          }
          break;

        case 'distribute':
          // distributeShapes expects array of shape IDs
          // AI agent always creates straight rows/columns, so pass align=true
          if (args.ids.length >= 2) {
            // Get shapes before distributing
            const shapesToDistribute = args.ids.map((id: string) => canvasContext.shapes.find((s: any) => s.id === id)).filter(Boolean);
            await canvasContext.distributeShapes(args.ids, args.axis, true);
            // Track all distributed shapes (use their current positions, they'll be updated)
            shapesToDistribute.forEach((shape: any) => {
              affectedAreas.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
            });
          }
          break;

        case 'createText':
          await canvasContext.addShape({
            type: 'text',
            x: args.x,
            y: args.y,
            text: args.text,
            fontSize: args.fontSize || 16,
            fill: args.fill || 'white',  // Default white for AI-created text
            fontFamily: args.fontFamily || 'Arial',
            fontStyle: `${args.bold ? 'bold ' : ''}${args.italic ? 'italic' : ''}`.trim() || 'normal',
          });
          affectedAreas.push({ x: args.x, y: args.y, width: 100, height: args.fontSize || 16 });
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
              opacity: shape.opacity !== undefined ? shape.opacity : 1,
              blendMode: shape.blendMode || 'source-over',
            };
            if (shape.stroke) {
              shapeData.stroke = shape.stroke;
            }
            if (shape.rotation) {
              shapeData.rotation = shape.rotation;
            }
            // Track all created shapes
            affectedAreas.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
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
              // Default fill: white for text, blue for other shapes
              fill: shape.fill || (shape.type === 'text' ? 'white' : '#3B82F6'),
              opacity: shape.opacity !== undefined ? shape.opacity : 1,
              blendMode: shape.blendMode || 'source-over',
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
            
            // Track all created shapes
            affectedAreas.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
            
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
  return affectedAreas;
}


