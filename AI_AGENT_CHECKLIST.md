# AI Agent Implementation Checklist

Use this checklist to track your implementation progress. Check off items as you complete them.

## Phase 1: AWS Infrastructure Setup (1-2 hours)

### 1.1 AWS Account & CLI
- [ ] Create AWS account (or use existing)
- [ ] Install AWS CLI: `npm install -g aws-cli`
- [ ] Configure credentials: `aws configure`
  - [ ] Enter Access Key ID
  - [ ] Enter Secret Access Key
  - [ ] Set region: `us-east-1`
  - [ ] Set output format: `json`
- [ ] Test connection: `aws sts get-caller-identity`

### 1.2 Store OpenAI API Key
- [ ] Get OpenAI API key from https://platform.openai.com/api-keys
- [ ] Create secret in AWS:
  ```bash
  aws secretsmanager create-secret \
    --name collabcanvas-openai-key \
    --description "OpenAI API key for CollabCanvas" \
    --secret-string '{"OPENAI_API_KEY":"sk-YOUR-KEY-HERE"}'
  ```
- [ ] Verify secret created: `aws secretsmanager list-secrets`

### 1.3 Create Lambda Function
- [ ] Go to AWS Lambda Console: https://console.aws.amazon.com/lambda
- [ ] Click "Create function"
- [ ] Select "Author from scratch"
- [ ] Function name: `collabcanvas-ai-agent`
- [ ] Runtime: `Node.js 20.x`
- [ ] Architecture: `x86_64`
- [ ] Click "Create function"
- [ ] Configure General settings:
  - [ ] Memory: `512 MB`
  - [ ] Timeout: `30 seconds`
- [ ] Add Permissions:
  - [ ] Go to Configuration → Permissions → Execution role
  - [ ] Click role name (opens IAM)
  - [ ] Add permissions → Attach policies
  - [ ] Search and attach: `SecretsManagerReadWrite`
- [ ] Add Environment variables:
  - [ ] Go to Configuration → Environment variables
  - [ ] Add: `SECRET_NAME` = `collabcanvas-openai-key`
  - [ ] Add: `NODE_ENV` = `production`

### 1.4 Create API Gateway
- [ ] Go to API Gateway Console: https://console.aws.amazon.com/apigateway
- [ ] Click "Create API"
- [ ] Select "HTTP API" → Build
- [ ] Add integration:
  - [ ] Integration type: Lambda
  - [ ] Lambda function: `collabcanvas-ai-agent`
  - [ ] API name: `collabcanvas-ai-api`
- [ ] Configure routes:
  - [ ] Method: `POST`
  - [ ] Resource path: `/ai/command`
- [ ] Configure CORS:
  - [ ] Access-Control-Allow-Origin: `https://collabcanvas-f7ee2.web.app`
  - [ ] Access-Control-Allow-Headers: `Authorization, Content-Type`
  - [ ] Access-Control-Allow-Methods: `POST, OPTIONS`
- [ ] Click "Create"
- [ ] **IMPORTANT: Copy the Invoke URL** (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)
  - [ ] Save URL to `.env` later: `VITE_AI_API_URL=...`

---

## Phase 2: Backend Lambda Implementation (3-4 hours)

### 2.1 Initialize Lambda Project
- [ ] Create directory: `mkdir aws-lambda && cd aws-lambda`
- [ ] Initialize npm: `npm init -y`
- [ ] Install dependencies:
  ```bash
  npm install langchain @langchain/openai @langchain/core zod firebase-admin @aws-sdk/client-secrets-manager
  ```
- [ ] Install dev dependencies:
  ```bash
  npm install -D typescript @types/node esbuild
  ```
- [ ] Create `tsconfig.json` (copy from plan)
- [ ] Update `package.json` scripts:
  - [ ] Add: `"build": "tsc"`
  - [ ] Add: `"deploy": "npm run build && cd dist && zip -r function.zip . && aws lambda update-function-code --function-name collabcanvas-ai-agent --zip-file fileb://function.zip && cd .."`

### 2.2 Create Directory Structure
- [ ] Create directories:
  ```bash
  mkdir -p src/auth src/middleware src/schemas src/utils
  ```

### 2.3 Implement Core Files
Copy code from `AI_AGENT_AWS_IMPLEMENTATION_PLAN.md`:

- [ ] **src/schemas/tools.ts** (Section 2.2)
  - [ ] All 10 Zod schemas defined
  - [ ] Export `toolSchemas` object

- [ ] **src/auth/firebaseAuth.ts** (Section 2.3)
  - [ ] Firebase Admin SDK initialized
  - [ ] `verifyFirebaseToken()` function

- [ ] **src/aiAgent.ts** (Section 2.4)
  - [ ] LangChain ChatOpenAI setup
  - [ ] 10 tools defined with schemas
  - [ ] System prompt for canvas operations
  - [ ] `executeAICommand()` function

- [ ] **src/middleware/rateLimit.ts** (Section 2.5)
  - [ ] In-memory rate limiter (20 req/min)
  - [ ] `checkRateLimit()` function

- [ ] **src/middleware/idempotency.ts** (Section 2.6)
  - [ ] In-memory cache (5 min TTL)
  - [ ] `getCachedResult()` function
  - [ ] `cacheResult()` function

- [ ] **src/utils/secrets.ts** (Section 2.7)
  - [ ] AWS Secrets Manager client
  - [ ] `getSecret()` function

- [ ] **src/index.ts** (Section 2.8) - MAIN HANDLER
  - [ ] Lambda handler function
  - [ ] Step 1: Extract Authorization header
  - [ ] Step 2: Verify Firebase token
  - [ ] Step 3: Parse request body
  - [ ] Step 4: Check idempotency cache
  - [ ] Step 5: Check rate limit
  - [ ] Step 6: Get OpenAI API key
  - [ ] Step 7: Execute AI command
  - [ ] Step 8: Cache result
  - [ ] Step 9: Return tool calls
  - [ ] Error handling with proper HTTP status codes

### 2.4 Build and Deploy
- [ ] Build TypeScript: `npm run build`
- [ ] Check `dist/` directory has compiled JS files
- [ ] Deploy to Lambda:
  ```bash
  cd dist
  zip -r function.zip .
  aws lambda update-function-code \
    --function-name collabcanvas-ai-agent \
    --zip-file fileb://function.zip
  cd ..
  ```
  Or use npm script: `npm run deploy`
- [ ] Verify deployment in Lambda Console
- [ ] Check function size (should be <50 MB)

### 2.5 Test Lambda Function
- [ ] Go to Lambda Console → Test tab
- [ ] Create test event with sample Firebase token
- [ ] Run test
- [ ] Check CloudWatch logs for errors
- [ ] Fix any errors and redeploy

---

## Phase 3: Frontend Integration (2-3 hours)

### 3.1 Environment Variables
- [ ] Go to project root: `cd ..` (from aws-lambda/)
- [ ] Create/update `.env`:
  ```
  VITE_AI_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/ai/command
  ```
  (Use the URL from Phase 1.4)

### 3.2 Create AI Agent Service
- [ ] Create file: `src/services/aiAgent.ts`
- [ ] Copy code from plan (Section 3.1)
- [ ] Functions:
  - [ ] `sendCommandToAI()` - calls AWS Lambda
  - [ ] `executeToolCalls()` - executes tools on canvas
- [ ] Tool mappings:
  - [ ] `createShape` → `canvasContext.addShape()`
  - [ ] `moveShape` → `canvasContext.updateShape()`
  - [ ] `resizeShape` → `canvasContext.updateShape()`
  - [ ] `rotateShape` → `canvasContext.updateShape()`
  - [ ] `align` → `canvasContext.alignShapes()`
  - [ ] `distribute` → `canvasContext.distributeShapes()`
  - [ ] `createText` → `canvasContext.addShape()`
  - [ ] `makeComponent` → TODO (future)
  - [ ] `instantiateComponent` → TODO (future)
  - [ ] `export` → console.log (future)

### 3.3 Create AI Agent Context
- [ ] Create file: `src/contexts/AIAgentContext.tsx`
- [ ] Copy code from plan (Section 3.2)
- [ ] State:
  - [ ] `isCommandBarOpen`
  - [ ] `commandHistory`
  - [ ] `isProcessing`
- [ ] Methods:
  - [ ] `openCommandBar()`
  - [ ] `closeCommandBar()`
  - [ ] `executeCommand()`
- [ ] Export `AIAgentProvider` and `useAIAgent` hook

### 3.4 Create Command Bar Component
- [ ] Create file: `src/components/Canvas/CommandBar.tsx`
- [ ] Copy code from plan (Section 3.3)
- [ ] Features:
  - [ ] Modal overlay
  - [ ] Text input for commands
  - [ ] Submit button / Enter key
  - [ ] Escape key to close
  - [ ] Loading indicator when processing
  - [ ] Command history (last 5)
  - [ ] Arrow up/down to navigate history

### 3.5 Update App.tsx
- [ ] Import `AIAgentProvider` from `./contexts/AIAgentContext`
- [ ] Import `CommandBar` from `./components/Canvas/CommandBar`
- [ ] Wrap app with `<AIAgentProvider>`:
  ```tsx
  <AIAgentProvider>
    {/* existing providers */}
    <CommandBar />
    {/* existing components */}
  </AIAgentProvider>
  ```

### 3.6 Add Keyboard Shortcut
- [ ] Open `src/hooks/useKeyboard.ts`
- [ ] Add new shortcut for Ctrl+/ (or Cmd+/):
  ```tsx
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    aiAgent.openCommandBar();
  }
  ```
- [ ] Import `useAIAgent` hook
- [ ] Call `openCommandBar()` on Ctrl+/

### 3.7 Build and Test Locally
- [ ] Start dev server: `npm run dev`
- [ ] Open browser: `http://localhost:5173`
- [ ] Log in
- [ ] Press `Ctrl+/` to open command bar
- [ ] Command bar should appear
- [ ] Type a command and press Enter
- [ ] Check browser console for errors

---

## Phase 4: Testing (1-2 hours)

### 4.1 Basic Commands
- [ ] "Create a rectangle at 100, 100 with size 200x150"
  - [ ] Rectangle appears at correct position
  - [ ] Size is correct (200x150)
- [ ] "Create a blue circle at 300, 200 with size 100x100"
  - [ ] Circle appears at correct position
  - [ ] Circle is blue
  - [ ] Size is correct (100x100)
- [ ] "Create text 'Hello World' at 500, 300"
  - [ ] Text appears at correct position
  - [ ] Text reads "Hello World"

### 4.2 Complex Commands
- [ ] "Create a login form with username field, password field, and login button"
  - [ ] Creates ~6 elements (labels + backgrounds + button)
  - [ ] Elements arranged vertically
  - [ ] Consistent spacing
- [ ] "Build a navbar with logo on left and 3 menu items on right"
  - [ ] Creates 4+ elements
  - [ ] Elements arranged horizontally
  - [ ] Logo on left, menu items on right

### 4.3 Error Handling
- [ ] Try command without logging in → should fail with "Unauthorized"
- [ ] Send 21 requests in 1 minute → should hit rate limit (429)
- [ ] Invalid command (gibberish) → should handle gracefully with error toast

### 4.4 Rate Limiting
- [ ] Send 20 commands quickly
- [ ] 21st command should fail with "Rate limit exceeded"
- [ ] Wait 1 minute
- [ ] Can send commands again

### 4.5 Idempotency
- [ ] Send command with same `requestId` twice
- [ ] Second request should return cached result (no OpenAI call)
- [ ] Check CloudWatch logs to verify

### 4.6 Collaboration
- [ ] Open app in two browsers (different users)
- [ ] User A sends AI command
- [ ] User B should see AI-generated shapes appear
- [ ] Real-time sync works

### 4.7 CloudWatch Logs
- [ ] Go to CloudWatch: https://console.aws.amazon.com/cloudwatch
- [ ] Navigate to Logs → Log groups → `/aws/lambda/collabcanvas-ai-agent`
- [ ] Check logs show:
  - [ ] User ID
  - [ ] Command text
  - [ ] Tool calls count
  - [ ] Latency
- [ ] No errors in logs

---

## Phase 5: Documentation & Polish (1 hour)

### 5.1 Update README
- [ ] Add "AI Agent Setup" section
- [ ] Document AWS prerequisites
- [ ] Document setup steps
- [ ] Document environment variables
- [ ] Document testing commands

### 5.2 Environment Variable Examples
- [ ] Create `.env.example` in project root:
  ```
  VITE_AI_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/ai/command
  ```
- [ ] Create `.env.example` in `aws-lambda/`:
  ```
  SECRET_NAME=collabcanvas-openai-key
  AWS_REGION=us-east-1
  ```

### 5.3 Add Toast Notifications (Optional)
- [ ] Create `src/components/UI/AICommandToast.tsx`
- [ ] Show toast for each tool execution:
  - "Created 3 shapes"
  - "Aligned selection"
  - "Created login form (6 elements)"
- [ ] Show error toasts for failures

### 5.4 Add Command Suggestions (Optional)
- [ ] Update `CommandBar.tsx`
- [ ] Show example commands when input is empty:
  - "Create a 200x300 rectangle at 100, 100"
  - "Align selected shapes to the left"
  - "Create a login form"
- [ ] Click suggestion to populate input

---

## Phase 6: Deployment (30 minutes)

### 6.1 Deploy Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Deploy to Firebase: `firebase deploy --only hosting`
- [ ] Verify deployment: https://collabcanvas-f7ee2.web.app
- [ ] Test AI commands on production

### 6.2 Verify Lambda Deployment
- [ ] Check Lambda function is deployed
- [ ] Check API Gateway is active
- [ ] Check CORS allows production origin
- [ ] Check rate limiting works
- [ ] Check CloudWatch logs are recording

### 6.3 Cost Monitoring Setup
- [ ] Set up AWS Budget (optional):
  - Go to AWS Billing → Budgets
  - Create budget: $10/month
  - Set alerts at 80% ($8)
- [ ] Enable cost allocation tags (optional)

---

## Final Checks ✅

### Functionality
- [ ] Command bar opens with Ctrl+/
- [ ] Can execute all 10 command types
- [ ] AI-generated shapes appear on canvas
- [ ] Other users see changes in real-time
- [ ] Error messages are user-friendly
- [ ] Rate limiting works (20 req/min)
- [ ] Idempotency works (retry doesn't duplicate)

### Performance
- [ ] Simple commands complete in <2s
- [ ] Complex commands complete in <5s
- [ ] No memory leaks
- [ ] CloudWatch logs show reasonable latency

### Security
- [ ] Cannot call API without authentication (401)
- [ ] OpenAI API key not exposed in frontend
- [ ] Rate limiting prevents abuse
- [ ] CORS only allows Firebase origin

### Documentation
- [ ] README has AI agent setup instructions
- [ ] Environment variable examples created
- [ ] Troubleshooting guide available
- [ ] Architecture documented

---

## Success! 🎉

Your AI Canvas Agent is now live!

**Total time spent**: ________ hours
**Cost estimate**: ~$2/month (AWS $0.50 + OpenAI GPT-3.5 $1.50)

### Next Steps
- [ ] Monitor CloudWatch logs for issues
- [ ] Track OpenAI costs on https://platform.openai.com/usage
- [ ] Implement streaming progress updates (PR #21)
- [ ] Add undo/redo for AI operations
- [ ] Implement components support (makeComponent, instantiateComponent)

---

## Troubleshooting Reference

If you encounter issues, see `AI_AGENT_IMPLEMENTATION_SUMMARY.md` → Troubleshooting section.

Common issues:
- **401 Unauthorized**: Firebase token verification failed
- **429 Rate limit**: Too many requests, wait 1 minute
- **500 Internal error**: Check CloudWatch logs
- **CORS error**: API Gateway CORS not configured
- **High latency**: Switch to GPT-3.5 Turbo

CloudWatch logs:
```bash
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```


