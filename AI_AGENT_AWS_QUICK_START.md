# AI Agent AWS Quick Start Guide

This is a condensed guide to get the AI agent running on AWS Lambda. See `AI_AGENT_AWS_IMPLEMENTATION_PLAN.md` for detailed explanations.

## Quick Setup (30 minutes)

### Step 1: AWS CLI Setup (5 min)
```bash
# Install AWS CLI
npm install -g aws-cli

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

### Step 2: Store OpenAI API Key (2 min)
```bash
aws secretsmanager create-secret \
  --name collabcanvas-openai-key \
  --description "OpenAI API key for CollabCanvas" \
  --secret-string '{"OPENAI_API_KEY":"sk-YOUR-KEY-HERE"}'
```

### Step 3: Create Lambda Project (10 min)
```bash
# Create project
mkdir aws-lambda
cd aws-lambda
npm init -y

# Install dependencies
npm install langchain @langchain/openai @langchain/core zod firebase-admin @aws-sdk/client-secrets-manager

# Install dev dependencies
npm install -D typescript @types/node esbuild

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create package.json scripts
npm pkg set scripts.build="tsc"
npm pkg set scripts.deploy="npm run build && cd dist && zip -r function.zip . && aws lambda update-function-code --function-name collabcanvas-ai-agent --zip-file fileb://function.zip"
```

### Step 4: Create Lambda Function via AWS Console (5 min)
1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda
2. Click "Create function"
3. **Function name**: `collabcanvas-ai-agent`
4. **Runtime**: Node.js 20.x
5. **Architecture**: x86_64
6. **Permissions**: Create new role with basic Lambda permissions
7. Click "Create function"
8. After creation:
   - **Configuration** → **General configuration** → Edit:
     - Memory: 512 MB
     - Timeout: 30 seconds
   - **Configuration** → **Permissions** → Execution role → Add permissions:
     - Attach policy: `SecretsManagerReadWrite`
   - **Configuration** → **Environment variables** → Add:
     - `SECRET_NAME` = `collabcanvas-openai-key`
     - `NODE_ENV` = `production`

### Step 5: Create API Gateway (5 min)
1. Go to API Gateway Console: https://console.aws.amazon.com/apigateway
2. Click "Create API" → **HTTP API** → Build
3. **Integrations**: Add integration → Lambda
   - Select your Lambda function: `collabcanvas-ai-agent`
   - API name: `collabcanvas-ai-api`
4. **Routes**: Configure routes
   - Method: `POST`
   - Resource path: `/ai/command`
5. **Configure CORS**:
   - Access-Control-Allow-Origin: `https://collabcanvas-f7ee2.web.app`
   - Access-Control-Allow-Headers: `Authorization, Content-Type`
   - Access-Control-Allow-Methods: `POST, OPTIONS`
6. Click "Create"
7. **Copy the Invoke URL** (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)

### Step 6: Implement Lambda Code (10 min)
Create the following files in `aws-lambda/src/`:

**`src/index.ts`** - Main handler (see plan)
**`src/aiAgent.ts`** - LangChain logic (see plan)
**`src/auth/firebaseAuth.ts`** - Token verification (see plan)
**`src/schemas/tools.ts`** - Tool schemas (see plan)
**`src/middleware/rateLimit.ts`** - Rate limiting (see plan)
**`src/middleware/idempotency.ts`** - Caching (see plan)
**`src/utils/secrets.ts`** - Secrets Manager client (see plan)

Copy the code from the detailed plan: `AI_AGENT_AWS_IMPLEMENTATION_PLAN.md` sections 2.2-2.8.

### Step 7: Build & Deploy Lambda (2 min)
```bash
# Build TypeScript
npm run build

# Package and deploy
cd dist
zip -r function.zip .
aws lambda update-function-code \
  --function-name collabcanvas-ai-agent \
  --zip-file fileb://function.zip
cd ..
```

Or use the npm script:
```bash
npm run deploy
```

### Step 8: Update Frontend (5 min)
```bash
cd ../  # Back to project root

# Add environment variable
echo "VITE_AI_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/ai/command" >> .env
```

Create frontend files (see plan sections 3.1-3.5):
- `src/services/aiAgent.ts`
- `src/contexts/AIAgentContext.tsx`
- `src/components/Canvas/CommandBar.tsx`
- Update `src/App.tsx`
- Update `src/hooks/useKeyboard.ts`

### Step 9: Test (5 min)
```bash
# Start frontend
npm run dev

# Open browser: http://localhost:5173
# Press Ctrl+/ to open command bar
# Try: "Create a rectangle at 100, 100 with size 200x150"
```

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```

---

## Testing Checklist

### Basic Commands ✓
```
- "Create a rectangle at 100, 100 with size 200x150"
- "Create a blue circle at 300, 200 with size 100x100"
- "Create text 'Hello World' at 500, 300"
```

### Multi-Shape Commands ✓
```
- "Create 3 rectangles in a row starting at 100, 100"
- "Create a button with text 'Click Me' at 200, 200"
```

### Complex Commands ✓
```
- "Create a login form with username field, password field, and login button"
- "Build a navbar with logo on left and 3 menu items on right"
```

### Error Handling ✓
```
- Try without authentication (should fail with 401)
- Send 21 requests in 1 minute (should hit rate limit)
- Invalid command (should handle gracefully)
```

---

## Environment Variables Reference

### Frontend (`.env`)
```bash
# Firebase (existing)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
# ... other Firebase config

# AI Agent (new)
VITE_AI_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/ai/command
```

### Lambda (AWS Console)
```
SECRET_NAME=collabcanvas-openai-key
NODE_ENV=production
AWS_REGION=us-east-1  # Set automatically by Lambda
```

---

## Troubleshooting

### "Unauthorized" Error
**Cause**: Firebase token verification failed
**Fix**: 
1. Check Lambda logs: `aws logs tail /aws/lambda/collabcanvas-ai-agent --follow`
2. Verify `firebase-admin` is initialized
3. Ensure user is logged in

### "Rate limit exceeded"
**Cause**: Too many requests (20/minute limit)
**Fix**: 
1. Wait 1 minute
2. Or increase limit in `src/middleware/rateLimit.ts` (line ~13: change `20` to higher number)

### "Failed to retrieve API key"
**Cause**: Secrets Manager access denied
**Fix**:
1. Go to Lambda → Configuration → Permissions → Execution role
2. Add policy: `SecretsManagerReadWrite`
3. Verify secret name matches: `collabcanvas-openai-key`

### High Latency (>5s)
**Cause**: GPT-4 is slower
**Fix**: 
1. Switch to GPT-3.5 Turbo in `src/aiAgent.ts`:
   ```typescript
   modelName: 'gpt-3.5-turbo'  // Instead of 'gpt-4-turbo-preview'
   ```
2. Increase Lambda memory (more memory = faster CPU)

### CORS Error
**Cause**: API Gateway CORS not configured
**Fix**:
1. Go to API Gateway → Your API → CORS
2. Add origin: `https://collabcanvas-f7ee2.web.app`
3. Add headers: `Authorization, Content-Type`

---

## Cost Monitoring

Check AWS costs:
```bash
# Lambda invocations this month
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=collabcanvas-ai-agent \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 2592000 \
  --statistics Sum

# API Gateway requests this month
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 2592000 \
  --statistics Sum
```

Expected costs (after free tier):
- **Lambda**: $0.01/month (30K requests)
- **API Gateway**: $0.03/month (30K requests)
- **Secrets Manager**: $0.40/month
- **Total AWS**: ~$0.50/month
- **OpenAI**: Variable ($0.10-0.50/day depending on usage)

---

## Next Steps

After basic implementation works:

1. **Add UI Polish**:
   - Toast notifications for AI actions
   - Loading spinner with progress
   - Command suggestions

2. **Add Advanced Features**:
   - Complex command support (multi-step)
   - Streaming progress updates
   - Undo/redo for AI operations

3. **Optimize Performance**:
   - Use GPT-3.5 Turbo for faster responses
   - Cache common commands
   - Batch multiple tool calls

4. **Add Analytics**:
   - Track command usage
   - Monitor success rate
   - Identify most common commands

5. **Deploy to Production**:
   - Update Firebase Hosting with new frontend
   - Set up CloudWatch alarms for errors
   - Configure auto-scaling for Lambda

---

## Resources

- **Full Implementation Plan**: `AI_AGENT_AWS_IMPLEMENTATION_PLAN.md`
- **AWS Lambda Console**: https://console.aws.amazon.com/lambda
- **API Gateway Console**: https://console.aws.amazon.com/apigateway
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/home#logs
- **Secrets Manager**: https://console.aws.amazon.com/secretsmanager
- **LangChain Docs**: https://js.langchain.com/docs
- **OpenAI API Docs**: https://platform.openai.com/docs


