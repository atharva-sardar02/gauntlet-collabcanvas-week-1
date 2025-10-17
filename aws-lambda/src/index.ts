import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { verifyFirebaseToken } from './auth/firebaseAuth';
import { executeAICommand } from './aiAgent';
import { getOpenAIApiKey } from './utils/secrets';
import { checkRateLimit, getRemainingRequests } from './middleware/rateLimit';
import { getCachedResult, cacheResult } from './middleware/idempotency';

/**
 * AWS Lambda Handler for CollabCanvas AI Agent
 * 
 * This function:
 * 1. Verifies Firebase authentication token
 * 2. Checks rate limiting (20 req/min per user)
 * 3. Checks idempotency cache (prevents duplicate operations)
 * 4. Retrieves OpenAI API key from Secrets Manager
 * 5. Executes AI command using LangChain + OpenAI
 * 6. Returns tool calls to frontend for execution
 */

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const requestStartTime = Date.now();
  
  console.log('=== AI Agent Request ===');
  console.log('Request ID:', context.awsRequestId);
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // ============================================
    // Step 1: Extract and verify Authorization header
    // ============================================
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return {
        statusCode: 401,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header. Expected: Bearer <Firebase-ID-Token>',
        }),
      };
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // ============================================
    // Step 2: Verify Firebase ID token
    // ============================================
    let user;
    try {
      user = await verifyFirebaseToken(token);
      console.log('Authenticated user:', user.uid, user.email);
    } catch (error: any) {
      console.error('Token verification failed:', error.message);
      return {
        statusCode: 401,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired Firebase token',
        }),
      };
    }

    // ============================================
    // Step 3: Parse request body
    // ============================================
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      console.error('Invalid JSON in request body');
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        }),
      };
    }

    const { command, canvasState, requestId } = body;

    // Validate required fields
    if (!command || typeof command !== 'string') {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Missing or invalid field: command (string required)',
        }),
      };
    }

    if (!requestId || typeof requestId !== 'string') {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Missing or invalid field: requestId (string required)',
        }),
      };
    }

    console.log('Command:', command);
    console.log('Request ID:', requestId);
    console.log('Canvas state:', {
      shapes: canvasState?.shapes?.length || 0,
      selection: canvasState?.selection?.length || 0,
    });

    // ============================================
    // Step 4: Check idempotency cache
    // ============================================
    const cachedResult = getCachedResult(requestId);
    if (cachedResult) {
      console.log('Returning cached result (idempotency)');
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          ...cachedResult,
          cached: true,
        }),
      };
    }

    // ============================================
    // Step 5: Check rate limit
    // ============================================
    if (!checkRateLimit(user.uid)) {
      const remaining = getRemainingRequests(user.uid);
      console.warn(`Rate limit exceeded for user ${user.uid}`);
      return {
        statusCode: 429,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded: 20 requests per minute',
          remaining,
        }),
      };
    }

    // ============================================
    // Step 6: Get OpenAI API key from Secrets Manager
    // ============================================
    const secretName = process.env.SECRET_NAME || 'collabcanvas-openai-key';
    let openaiApiKey;
    
    try {
      openaiApiKey = await getOpenAIApiKey(secretName);
    } catch (error: any) {
      console.error('Failed to retrieve OpenAI API key:', error.message);
      return {
        statusCode: 500,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to retrieve API key',
        }),
      };
    }

    // ============================================
    // Step 7: Execute AI command
    // ============================================
    const aiStartTime = Date.now();
    let toolCalls;
    
    try {
      toolCalls = await executeAICommand(command, canvasState || {}, openaiApiKey);
    } catch (error: any) {
      console.error('AI command execution failed:', error.message);
      return {
        statusCode: 500,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'AI Command Failed',
          message: error.message || 'Failed to process AI command',
        }),
      };
    }

    const aiLatency = Date.now() - aiStartTime;
    console.log(`AI command completed in ${aiLatency}ms`);
    console.log(`Generated ${toolCalls.length} tool calls`);

    // ============================================
    // Step 8: Cache result for idempotency
    // ============================================
    const result = {
      toolCalls,
      latency: aiLatency,
      timestamp: Date.now(),
    };
    
    cacheResult(requestId, result);

    // ============================================
    // Step 9: Log and return response
    // ============================================
    const totalLatency = Date.now() - requestStartTime;
    
    console.log('=== Request Summary ===');
    console.log('User:', user.uid);
    console.log('Command:', command.substring(0, 100));
    console.log('Tool calls:', toolCalls.length);
    console.log('AI latency:', aiLatency, 'ms');
    console.log('Total latency:', totalLatency, 'ms');
    console.log('Remaining requests:', getRemainingRequests(user.uid));

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(result),
    };

  } catch (error: any) {
    // ============================================
    // Catch-all error handler
    // ============================================
    console.error('Unexpected error:', error);
    console.error('Stack trace:', error.stack);

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
    };
  }
};

/**
 * Get CORS headers for response
 */
function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://collabcanvas-f7ee2.web.app',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}


