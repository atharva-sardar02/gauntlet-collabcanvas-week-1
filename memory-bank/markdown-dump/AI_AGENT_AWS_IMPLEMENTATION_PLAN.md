# AI Agent AWS Implementation Plan

## Overview
Implement AI Canvas Agent using **Langchain on AWS Lambda**, while keeping frontend on **Firebase Hosting**. This architecture avoids Firebase's Blaze plan requirement by moving serverless compute to AWS.

## Architecture

```
┌─────────────────────┐
│  Firebase Hosting   │  Frontend (React + Vite)
│    (Free Tier)      │  - Canvas UI
└──────────┬──────────┘  - Firebase Auth
           │
           │ 1. User sends command with Firebase ID token
           ▼
┌─────────────────────┐
│   AWS API Gateway   │  HTTP API with CORS
│   (HTTP API)        │  - Rate limiting
└──────────┬──────────┘  - Throttling (20 req/min/user)
           │
           │ 2. Forwards to Lambda with token
           ▼
┌─────────────────────┐
│   AWS Lambda        │  Node.js 20.x
│   (Node.js)         │  - Verifies Firebase ID token
└──────────┬──────────┘  - Calls LangChain → OpenAI
           │             - Returns tool calls
           │
           ├─────────────► AWS Secrets Manager
           │               (OPENAI_API_KEY)
           │
           └─────────────► CloudWatch Logs
                           (Monitoring & debugging)
```

## Implementation Phases

### Phase 1: AWS Infrastructure Setup (1-2 hours)

#### 1.1 AWS Account & CLI Setup
- [ ] Create AWS account (if not exists)
- [ ] Install AWS CLI: `npm install -g aws-cli`
- [ ] Configure credentials: `aws configure`
- [ ] Set region (recommended: `us-east-1` for lowest latency)

#### 1.2 Create Secrets Manager Secret
```bash
# Store OpenAI API key securely
aws secretsmanager create-secret \
  --name collabcanvas-openai-key \
  --description "OpenAI API key for CollabCanvas AI agent" \
  --secret-string '{"OPENAI_API_KEY":"sk-your-key-here"}'
```

#### 1.3 Create IAM Role for Lambda
```bash
# Create role with permissions:
# 1. Basic Lambda execution (CloudWatch logs)
# 2. Secrets Manager read access
# 3. (Optional) Firestore access if needed
```

**Role Policy**: `lambda-execution-role`
- Permissions:
  - `AWSLambdaBasicExecutionRole` (CloudWatch logs)
  - `SecretsManagerReadWrite` (read secrets)

#### 1.4 Create Lambda Function (via AWS Console or CLI)
- **Runtime**: Node.js 20.x
- **Handler**: `index.handler`
- **Memory**: 512 MB (sufficient for LangChain)
- **Timeout**: 30 seconds (for AI processing)
- **Environment Variables**:
  - `SECRET_NAME=collabcanvas-openai-key`
  - `NODE_ENV=production`

#### 1.5 Create API Gateway HTTP API
- **Type**: HTTP API (cheaper, simpler than REST API)
- **Route**: `POST /ai/command`
- **Integration**: Lambda proxy integration
- **CORS**: 
  - Allow origins: `https://collabcanvas-f7ee2.web.app` (your Firebase domain)
  - Allow headers: `Authorization, Content-Type`
  - Allow methods: `POST, OPTIONS`
- **Throttling**: 
  - Rate limit: 20 requests per minute per IP
  - Burst: 10 requests

#### 1.6 (Optional) Add WAF for Security
- Block common attacks (SQL injection, XSS)
- IP rate limiting
- Geographic restrictions if needed

---

### Phase 2: Backend Lambda Implementation (3-4 hours)

#### Directory Structure
```
aws-lambda/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Lambda entry point
│   ├── aiAgent.ts            # LangChain agent logic
│   ├── auth/
│   │   └── firebaseAuth.ts   # Firebase token verification
│   ├── middleware/
│   │   ├── rateLimit.ts      # Per-user rate limiting
│   │   └── idempotency.ts    # Request deduplication
│   ├── schemas/
│   │   └── tools.ts          # Zod schemas for 10 tools
│   └── utils/
│       ├── secrets.ts        # AWS Secrets Manager client
│       └── logger.ts         # Structured logging
└── dist/                     # Compiled JS (deploy this)
```

#### 2.1 Initialize Lambda Project
```bash
mkdir aws-lambda
cd aws-lambda
npm init -y

# Install dependencies
npm install \
  langchain \
  @langchain/openai \
  @langchain/core \
  zod \
  firebase-admin \
  @aws-sdk/client-secrets-manager \
  dotenv

# Install dev dependencies
npm install -D \
  typescript \
  @types/node \
  esbuild \
  eslint
```

**Key Dependencies**:
- `langchain`: Main framework for AI agent
- `@langchain/openai`: OpenAI integration
- `zod`: Schema validation
- `firebase-admin`: Verify Firebase ID tokens
- `@aws-sdk/client-secrets-manager`: Retrieve API keys

#### 2.2 Define AI Tool Schemas (`src/schemas/tools.ts`)
Following tasks.md PR #19.3, define Zod schemas for 10 tools:

```typescript
import { z } from 'zod';

// 1. Create Shape
export const createShapeSchema = z.object({
  type: z.enum(['rectangle', 'circle', 'triangle', 'star']),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  fill: z.string().optional().default('#3B82F6'),
  stroke: z.string().optional(),
});

// 2. Move Shape
export const moveShapeSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
});

// 3. Resize Shape
export const resizeShapeSchema = z.object({
  id: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
});

// 4. Rotate Shape
export const rotateShapeSchema = z.object({
  id: z.string(),
  degrees: z.number(),
});

// 5. Align Shapes
export const alignSchema = z.object({
  ids: z.array(z.string()).min(1),
  mode: z.enum(['left', 'right', 'top', 'bottom', 'center-h', 'center-v']),
});

// 6. Distribute Shapes
export const distributeSchema = z.object({
  ids: z.array(z.string()).min(2),
  axis: z.enum(['horizontal', 'vertical']),
});

// 7. Create Text
export const createTextSchema = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  fontSize: z.number().positive().optional().default(16),
  fill: z.string().optional().default('#000000'),
});

// 8. Make Component (for future use)
export const makeComponentSchema = z.object({
  selectionIds: z.array(z.string()).min(1),
  name: z.string(),
});

// 9. Instantiate Component (for future use)
export const instantiateComponentSchema = z.object({
  componentId: z.string(),
  x: z.number(),
  y: z.number(),
});

// 10. Export Canvas
export const exportSchema = z.object({
  scope: z.enum(['canvas', 'selection']),
  format: z.literal('png'),
});

// Tool definitions for LangChain
export const toolSchemas = {
  createShape: createShapeSchema,
  moveShape: moveShapeSchema,
  resizeShape: resizeShapeSchema,
  rotateShape: rotateShapeSchema,
  align: alignSchema,
  distribute: distributeSchema,
  createText: createTextSchema,
  makeComponent: makeComponentSchema,
  instantiateComponent: instantiateComponentSchema,
  export: exportSchema,
};
```

#### 2.3 Firebase Token Verification (`src/auth/firebaseAuth.ts`)
```typescript
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (no credentials needed in Lambda if using service account)
if (!admin.apps.length) {
  admin.initializeApp();
}

export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    throw new Error('Unauthorized: Invalid Firebase token');
  }
}
```

#### 2.4 LangChain Agent Implementation (`src/aiAgent.ts`)
```typescript
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputToolsParser } from '@langchain/core/output_parsers/openai_tools';
import { toolSchemas } from './schemas/tools';

export async function executeAICommand(
  commandText: string,
  canvasState: any, // Current shapes, selection, etc.
  openaiApiKey: string
) {
  // Initialize OpenAI model with function calling
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0,
    openAIApiKey: openaiApiKey,
  });

  // Define tools for function calling
  const tools = [
    {
      type: 'function',
      function: {
        name: 'createShape',
        description: 'Creates a new shape on the canvas (rectangle, circle, triangle, star)',
        parameters: toolSchemas.createShape,
      },
    },
    {
      type: 'function',
      function: {
        name: 'moveShape',
        description: 'Moves an existing shape to a new position',
        parameters: toolSchemas.moveShape,
      },
    },
    {
      type: 'function',
      function: {
        name: 'resizeShape',
        description: 'Resizes an existing shape',
        parameters: toolSchemas.resizeShape,
      },
    },
    {
      type: 'function',
      function: {
        name: 'rotateShape',
        description: 'Rotates an existing shape by degrees',
        parameters: toolSchemas.rotateShape,
      },
    },
    {
      type: 'function',
      function: {
        name: 'align',
        description: 'Aligns multiple shapes (left, right, top, bottom, center)',
        parameters: toolSchemas.align,
      },
    },
    {
      type: 'function',
      function: {
        name: 'distribute',
        description: 'Distributes multiple shapes evenly (horizontal or vertical)',
        parameters: toolSchemas.distribute,
      },
    },
    {
      type: 'function',
      function: {
        name: 'createText',
        description: 'Creates a text element on the canvas',
        parameters: toolSchemas.createText,
      },
    },
    {
      type: 'function',
      function: {
        name: 'makeComponent',
        description: 'Creates a reusable component from selected shapes',
        parameters: toolSchemas.makeComponent,
      },
    },
    {
      type: 'function',
      function: {
        name: 'instantiateComponent',
        description: 'Creates an instance of a component',
        parameters: toolSchemas.instantiateComponent,
      },
    },
    {
      type: 'function',
      function: {
        name: 'export',
        description: 'Exports canvas or selection as PNG',
        parameters: toolSchemas.export,
      },
    },
  ];

  // System prompt for canvas operations
  const systemPrompt = `You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas.

Current canvas state:
- Shapes: ${JSON.stringify(canvasState.shapes || [])}
- Selection: ${JSON.stringify(canvasState.selection || [])}
- Canvas size: 5000x5000px

When the user asks to create elements:
1. Plan the layout logically (top-to-bottom, left-to-right)
2. Use consistent spacing (20px between elements)
3. Size elements appropriately (buttons: 120x40, inputs: 200x40, etc.)
4. Align related elements
5. For complex commands (e.g., "create a login form"), break into multiple tool calls

Available tools: createShape, moveShape, resizeShape, rotateShape, align, distribute, createText, makeComponent, instantiateComponent, export.

Return tool calls to execute the user's command.`;

  // Create prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', '{command}'],
  ]);

  // Bind tools to model
  const modelWithTools = model.bind({ tools });

  // Create chain
  const chain = prompt.pipe(modelWithTools).pipe(new JsonOutputToolsParser());

  // Execute
  const result = await chain.invoke({ command: commandText });

  return result; // Array of tool calls
}
```

#### 2.5 Rate Limiting Middleware (`src/middleware/rateLimit.ts`)
```typescript
// In-memory rate limiter (for single Lambda instance)
// For multi-instance, use DynamoDB or ElastiCache

const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(userId);

  if (!limit || limit.resetAt < now) {
    // Reset window
    rateLimits.set(userId, { count: 1, resetAt: now + 60000 }); // 1 minute
    return true;
  }

  if (limit.count >= 20) {
    return false; // Exceeded 20 req/min
  }

  limit.count++;
  return true;
}
```

#### 2.6 Idempotency Middleware (`src/middleware/idempotency.ts`)
```typescript
// Cache results for 5 minutes to prevent duplicate operations
const cache = new Map<string, { result: any; expiresAt: number }>();

export function getCachedResult(requestId: string): any | null {
  const cached = cache.get(requestId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }
  cache.delete(requestId);
  return null;
}

export function cacheResult(requestId: string, result: any): void {
  cache.set(requestId, {
    result,
    expiresAt: Date.now() + 300000, // 5 minutes
  });
}
```

#### 2.7 Secrets Manager Client (`src/utils/secrets.ts`)
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    const secret = JSON.parse(response.SecretString || '{}');
    return secret.OPENAI_API_KEY;
  } catch (error) {
    console.error('Failed to retrieve secret:', error);
    throw new Error('Failed to retrieve API key');
  }
}
```

#### 2.8 Lambda Handler (`src/index.ts`)
```typescript
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { verifyFirebaseToken } from './auth/firebaseAuth';
import { executeAICommand } from './aiAgent';
import { getSecret } from './utils/secrets';
import { checkRateLimit } from './middleware/rateLimit';
import { getCachedResult, cacheResult } from './middleware/idempotency';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log('Received request:', JSON.stringify(event, null, 2));

  try {
    // 1. Extract Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      };
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // 2. Verify Firebase ID token
    const user = await verifyFirebaseToken(token);
    console.log('Authenticated user:', user.uid);

    // 3. Parse request body
    const body = JSON.parse(event.body || '{}');
    const { command, canvasState, requestId } = body;

    if (!command || !requestId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: command, requestId' }),
      };
    }

    // 4. Check for cached result (idempotency)
    const cached = getCachedResult(requestId);
    if (cached) {
      console.log('Returning cached result for requestId:', requestId);
      return {
        statusCode: 200,
        body: JSON.stringify(cached),
      };
    }

    // 5. Rate limiting
    if (!checkRateLimit(user.uid)) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Rate limit exceeded: 20 requests per minute' }),
      };
    }

    // 6. Get OpenAI API key from Secrets Manager
    const openaiApiKey = await getSecret(process.env.SECRET_NAME || 'collabcanvas-openai-key');

    // 7. Execute AI command
    const startTime = Date.now();
    const toolCalls = await executeAICommand(command, canvasState, openaiApiKey);
    const latency = Date.now() - startTime;

    console.log('AI command executed:', {
      userId: user.uid,
      command: command.substring(0, 100),
      toolCallsCount: toolCalls.length,
      latency,
    });

    // 8. Cache result
    const result = { toolCalls, latency };
    cacheResult(requestId, result);

    // 9. Return tool calls to client
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://collabcanvas-f7ee2.web.app',
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
```

#### 2.9 Build & Deploy Script
```bash
# Build TypeScript
npm run build

# Package for Lambda (with node_modules)
cd dist
zip -r function.zip .
cd ..

# Deploy to Lambda
aws lambda update-function-code \
  --function-name collabcanvas-ai-agent \
  --zip-file fileb://dist/function.zip
```

---

### Phase 3: Frontend Integration (2-3 hours)

#### 3.1 Create AI Agent Service (`src/services/aiAgent.ts`)
```typescript
import { auth } from './firebase';

const AI_API_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/ai/command';

export interface ToolCall {
  type: string;
  function: {
    name: string;
    arguments: any;
  };
}

export async function sendCommandToAI(
  command: string,
  canvasState: any
): Promise<{ toolCalls: ToolCall[]; latency: number }> {
  // Generate unique request ID for idempotency
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

  // Get Firebase ID token
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  const idToken = await currentUser.getIdToken();

  // Call AWS Lambda via API Gateway
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
    const errorData = await response.json();
    throw new Error(errorData.error || 'AI command failed');
  }

  return await response.json();
}

export async function executeToolCalls(
  toolCalls: ToolCall[],
  canvasContext: any
): Promise<void> {
  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;

    try {
      switch (name) {
        case 'createShape':
          await canvasContext.addShape({
            type: args.type,
            x: args.x,
            y: args.y,
            width: args.width,
            height: args.height,
            fill: args.fill || '#3B82F6',
            stroke: args.stroke,
          });
          break;

        case 'moveShape':
          await canvasContext.updateShape(args.id, { x: args.x, y: args.y });
          break;

        case 'resizeShape':
          await canvasContext.updateShape(args.id, { width: args.width, height: args.height });
          break;

        case 'rotateShape':
          await canvasContext.updateShape(args.id, { rotation: args.degrees });
          break;

        case 'align':
          await canvasContext.alignShapes(args.ids, args.mode);
          break;

        case 'distribute':
          await canvasContext.distributeShapes(args.ids, args.axis);
          break;

        case 'createText':
          await canvasContext.addShape({
            type: 'text',
            x: args.x,
            y: args.y,
            text: args.text,
            fontSize: args.fontSize || 16,
            fill: args.fill || '#000000',
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
          // Call export service
          console.log('Export requested:', args.scope, args.format);
          break;

        default:
          console.warn('Unknown tool:', name);
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      throw error;
    }
  }
}
```

#### 3.2 Create AI Agent Context (`src/contexts/AIAgentContext.tsx`)
```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { sendCommandToAI, executeToolCalls } from '../services/aiAgent';

interface AIAgentContextType {
  isCommandBarOpen: boolean;
  commandHistory: string[];
  isProcessing: boolean;
  openCommandBar: () => void;
  closeCommandBar: () => void;
  executeCommand: (command: string) => Promise<void>;
}

const AIAgentContext = createContext<AIAgentContextType | undefined>(undefined);

export function AIAgentProvider({ children }: { children: ReactNode }) {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasContext = useCanvas();

  const openCommandBar = () => setIsCommandBarOpen(true);
  const closeCommandBar = () => setIsCommandBarOpen(false);

  const executeCommand = async (command: string) => {
    setIsProcessing(true);

    try {
      // Build canvas state
      const canvasState = {
        shapes: canvasContext.shapes,
        selection: canvasContext.selectedShapeIds,
      };

      // Send to AI
      const { toolCalls, latency } = await sendCommandToAI(command, canvasState);
      console.log(`AI responded in ${latency}ms with ${toolCalls.length} tool calls`);

      // Execute tool calls
      await executeToolCalls(toolCalls, canvasContext);

      // Add to history
      setCommandHistory((prev) => [command, ...prev].slice(0, 10)); // Keep last 10

      // Show success toast
      // TODO: Add toast notification

    } catch (error: any) {
      console.error('AI command failed:', error);
      // TODO: Show error toast
      throw error;
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
        openCommandBar,
        closeCommandBar,
        executeCommand,
      }}
    >
      {children}
    </AIAgentContext.Provider>
  );
}

export function useAIAgent() {
  const context = useContext(AIAgentContext);
  if (!context) {
    throw new Error('useAIAgent must be used within AIAgentProvider');
  }
  return context;
}
```

#### 3.3 Create Command Bar Component (`src/components/Canvas/CommandBar.tsx`)
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../../contexts/AIAgentContext';

export function CommandBar() {
  const { isCommandBarOpen, closeCommandBar, executeCommand, isProcessing, commandHistory } =
    useAIAgent();
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandBarOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommandBarOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    try {
      await executeCommand(input);
      setInput('');
      closeCommandBar();
    } catch (error) {
      // Error already logged
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeCommandBar();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (commandHistory[newIndex]) {
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setInput(newIndex >= 0 ? commandHistory[newIndex] : '');
    }
  };

  if (!isCommandBarOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">AI Command</h2>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to create, move, align shapes..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeCommandBar}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!input.trim() || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Execute'}
            </button>
          </div>
        </form>

        {commandHistory.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Recent commands:</p>
            <div className="space-y-1">
              {commandHistory.slice(0, 5).map((cmd, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-700 hover:text-blue-600 cursor-pointer truncate"
                  onClick={() => setInput(cmd)}
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
```

#### 3.4 Add Keyboard Shortcut (`src/hooks/useKeyboard.ts`)
Add to existing shortcuts:
```typescript
// Ctrl/Cmd + / to open AI command bar
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      aiAgent.openCommandBar();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### 3.5 Update App.tsx
```typescript
import { AIAgentProvider } from './contexts/AIAgentContext';
import { CommandBar } from './components/Canvas/CommandBar';

function App() {
  return (
    <AIAgentProvider>
      {/* existing providers */}
      <CommandBar />
      {/* existing components */}
    </AIAgentProvider>
  );
}
```

---

### Phase 4: Testing & Optimization (1-2 hours)

#### 4.1 Test Basic Commands
- [ ] "Create a rectangle at 100, 100 with size 200x150"
- [ ] "Move shape [id] to 300, 400"
- [ ] "Align selected shapes to the left"

#### 4.2 Test Complex Commands
- [ ] "Create a login form with username, password, and submit button"
- [ ] "Build a navbar with logo and 3 menu items"

#### 4.3 Test Error Handling
- [ ] Invalid Firebase token
- [ ] Rate limit exceeded
- [ ] OpenAI API timeout
- [ ] Invalid shape ID

#### 4.4 Test Performance
- [ ] Simple commands: <2s latency
- [ ] Complex commands: <5s latency
- [ ] Concurrent requests from multiple users

#### 4.5 Monitor CloudWatch Logs
- [ ] Check logs for errors
- [ ] Monitor Lambda duration and memory usage
- [ ] Track rate limit violations

---

### Phase 5: Documentation & Environment Variables (1 hour)

#### 5.1 Update README.md
Document AWS setup:
```markdown
## AI Agent Setup (AWS Lambda)

The AI agent runs on AWS Lambda to avoid Firebase's paid tier requirement.

### Prerequisites
- AWS account
- OpenAI API key

### Setup
1. Deploy Lambda function: `cd aws-lambda && npm run deploy`
2. Configure API Gateway URL in `src/services/aiAgent.ts`
3. Test with Ctrl+/ to open command bar
```

#### 5.2 Environment Variables
**Frontend** (`.env`):
```
VITE_AI_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/ai/command
```

**Lambda** (Environment Variables in AWS Console):
```
SECRET_NAME=collabcanvas-openai-key
AWS_REGION=us-east-1
NODE_ENV=production
```

#### 5.3 Create `.env.example` files
```bash
# Frontend
echo "VITE_AI_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/ai/command" > .env.example

# Lambda
cd aws-lambda
echo "SECRET_NAME=collabcanvas-openai-key\nAWS_REGION=us-east-1" > .env.example
```

---

## Cost Estimates (AWS Free Tier)

### Lambda
- **Free Tier**: 1M requests/month + 400,000 GB-seconds compute
- **Estimate**: ~1,000 AI commands/day = 30,000/month (well within free tier)
- **After Free Tier**: $0.20 per 1M requests + $0.0000166667 per GB-second

### API Gateway
- **Free Tier**: 1M requests/month (first 12 months)
- **After Free Tier**: $1.00 per 1M requests

### Secrets Manager
- **Cost**: $0.40/month per secret
- **1 secret**: $0.40/month

### CloudWatch Logs
- **Free Tier**: 5 GB ingestion/month
- **Estimate**: <1 GB/month for AI agent logs

### Total Monthly Cost (after free tier expires)
- **Secrets Manager**: $0.40
- **Lambda**: ~$0.01 (30K requests)
- **API Gateway**: ~$0.03 (30K requests)
- **CloudWatch**: $0 (within free tier)
- **TOTAL**: ~$0.50/month

**OpenAI Costs** (separate):
- GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
- Estimate: ~$0.10-0.50 per day depending on usage

---

## Deployment Checklist

### AWS Setup
- [ ] AWS account created
- [ ] AWS CLI installed and configured
- [ ] Secrets Manager secret created with OpenAI key
- [ ] IAM role created for Lambda
- [ ] Lambda function created and deployed
- [ ] API Gateway HTTP API created
- [ ] CORS configured on API Gateway
- [ ] API Gateway URL noted

### Frontend Updates
- [ ] `src/services/aiAgent.ts` created
- [ ] `src/contexts/AIAgentContext.tsx` created
- [ ] `src/components/Canvas/CommandBar.tsx` created
- [ ] Keyboard shortcut added (Ctrl+/)
- [ ] AIAgentProvider added to App.tsx
- [ ] Environment variable set (VITE_AI_API_URL)

### Testing
- [ ] Basic commands work
- [ ] Complex commands work
- [ ] Rate limiting enforced
- [ ] Idempotency works (retry doesn't duplicate)
- [ ] Error handling works
- [ ] CloudWatch logs show requests

### Documentation
- [ ] README updated with AWS setup
- [ ] Environment variable examples created
- [ ] Architecture diagram added

---

## Advantages of AWS Lambda Approach

1. **No Firebase Blaze Plan Required**: Stay on free tier for Firebase
2. **Cost-Effective**: AWS free tier + $0.50/month after
3. **Scalable**: Auto-scales with demand
4. **Secure**: API keys in Secrets Manager, not in code
5. **Isolated**: Backend logic separate from frontend
6. **Monitoring**: CloudWatch provides detailed logs
7. **Rate Limiting**: Built-in throttling at API Gateway level
8. **Global**: Can deploy to multiple regions for lower latency

---

## Next Steps (After Basic Implementation)

1. **Add Streaming**: Stream tool execution progress to frontend
2. **Add Complex Command Support**: Multi-step planning with progress bars
3. **Add Undo/Redo**: Track AI-generated operations in history
4. **Add Components Support**: Implement makeComponent and instantiateComponent tools
5. **Optimize Performance**: Cache AI responses, reduce latency
6. **Add Analytics**: Track most common commands, success rate
7. **Multi-Region Deployment**: Deploy Lambda to multiple regions for global users

---

## Troubleshooting

### Firebase Token Verification Fails
- Ensure `firebase-admin` is initialized correctly
- Check IAM permissions for Lambda role
- Verify token is not expired

### OpenAI API Calls Fail
- Check Secrets Manager has correct API key
- Verify Lambda has permission to read secrets
- Check OpenAI API key is valid and has credits

### Rate Limiting Too Aggressive
- Adjust API Gateway throttling settings
- Increase per-user limit in `rateLimit.ts`
- Use DynamoDB for distributed rate limiting

### High Latency
- Use GPT-3.5 Turbo instead of GPT-4 for faster responses
- Increase Lambda memory (more memory = more CPU)
- Deploy Lambda closer to users (multi-region)

---

## References

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway HTTP API](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
- [LangChain Documentation](https://js.langchain.com/docs/get_started/introduction)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)


