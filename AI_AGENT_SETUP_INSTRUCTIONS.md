# AI Agent Setup Instructions

## ✅ What's Done

The AI agent code is complete! Here's what has been implemented:

### Backend (AWS Lambda)
- ✅ Complete Lambda function with TypeScript
- ✅ 10 AI tool schemas (Zod validation)
- ✅ LangChain + OpenAI integration
- ✅ Firebase token verification
- ✅ Rate limiting (20 req/min per user)
- ✅ Idempotency caching (5 min TTL)
- ✅ AWS Secrets Manager integration
- ✅ Structured logging

### Frontend (React)
- ✅ AI Agent service (calls AWS Lambda)
- ✅ AI Agent context and hook
- ✅ Command Bar component (beautiful UI)
- ✅ Keyboard shortcut (Ctrl+/ or Cmd+/)
- ✅ Integrated with App.tsx and Canvas
- ✅ Command history and examples
- ✅ Error handling and loading states

## 🎯 What You Need to Do

To get the AI agent working, you need to:

### 1. Set Up AWS Infrastructure (30 minutes)

#### Step 1: Install AWS CLI
```bash
npm install -g aws-cli
```

#### Step 2: Configure AWS Credentials
```bash
aws configure
```
Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Region: `us-east-1`
- Output format: `json`

#### Step 3: Create OpenAI API Key Secret
```bash
aws secretsmanager create-secret \
  --name collabcanvas-openai-key \
  --description "OpenAI API key for CollabCanvas" \
  --secret-string '{"OPENAI_API_KEY":"sk-YOUR-OPENAI-KEY-HERE"}'
```
Replace `sk-YOUR-OPENAI-KEY-HERE` with your actual OpenAI API key from https://platform.openai.com/api-keys

#### Step 4: Create Lambda Function (via AWS Console)
1. Go to https://console.aws.amazon.com/lambda
2. Click "Create function"
3. Select "Author from scratch"
4. Function name: `collabcanvas-ai-agent`
5. Runtime: `Node.js 20.x`
6. Architecture: `x86_64`
7. Click "Create function"

#### Step 5: Configure Lambda
After creation:
- **Configuration → General configuration → Edit**:
  - Memory: `512 MB`
  - Timeout: `30 seconds`
  - Click "Save"

- **Configuration → Permissions → Execution role**:
  - Click the role name (opens IAM)
  - Click "Add permissions" → "Attach policies"
  - Search for `SecretsManagerReadWrite`
  - Select it and click "Add permissions"

- **Configuration → Environment variables → Edit → Add**:
  - Key: `SECRET_NAME`, Value: `collabcanvas-openai-key`
  - Key: `NODE_ENV`, Value: `production`
  - Click "Save"

#### Step 6: Create API Gateway
1. Go to https://console.aws.amazon.com/apigateway
2. Click "Create API"
3. Select "HTTP API" → Click "Build"
4. **Add integration**:
   - Integration type: Lambda
   - AWS Region: us-east-1
   - Lambda function: `collabcanvas-ai-agent`
   - API name: `collabcanvas-ai-api`
   - Click "Next"
5. **Configure routes**:
   - Method: `POST`
   - Resource path: `/ai/command`
   - Integration target: `collabcanvas-ai-agent`
   - Click "Next"
6. **Configure CORS**:
   - Access-Control-Allow-Origin: `https://collabcanvas-f7ee2.web.app`
   - Access-Control-Allow-Headers: `Authorization, Content-Type`
   - Access-Control-Allow-Methods: `POST, OPTIONS`
   - Click "Next"
7. Click "Create"
8. **IMPORTANT: Copy the "Invoke URL"** (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)

### 2. Deploy Lambda Code (5 minutes)

#### Step 1: Install Dependencies
```bash
cd aws-lambda
npm install
```

#### Step 2: Build TypeScript
```bash
npm run build
```

#### Step 3: Deploy to AWS
```bash
cd dist
zip -r ../function.zip .
cd ..
aws lambda update-function-code \
  --function-name collabcanvas-ai-agent \
  --zip-file fileb://function.zip
```

Or use the npm script:
```bash
npm run deploy
```

#### Step 4: Verify Deployment
Go to Lambda Console and check:
- Code tab shows your files
- Function size is reasonable (<10 MB)
- Environment variables are set

### 3. Update Frontend Configuration (2 minutes)

#### Step 1: Create `.env` File
In the project root (not in `aws-lambda/`), create or update `.env`:
```env
VITE_AI_API_URL=https://YOUR-API-GATEWAY-URL.execute-api.us-east-1.amazonaws.com/ai/command
```
Replace `YOUR-API-GATEWAY-URL` with the Invoke URL from Step 6 of AWS setup (without trailing slash).

Example:
```env
VITE_AI_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/ai/command
```

### 4. Test Locally (5 minutes)

#### Step 1: Start Dev Server
```bash
npm run dev
```

#### Step 2: Test in Browser
1. Open http://localhost:5173
2. Log in
3. Press `Ctrl+/` (or `Cmd+/` on Mac)
4. Command bar should appear
5. Try: "Create a rectangle at 100, 100 with size 200x150"
6. Rectangle should appear!

#### Step 3: Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```
You should see log entries for your request.

### 5. Deploy to Production (2 minutes)

```bash
npm run build
firebase deploy --only hosting
```

Test on your production URL: https://collabcanvas-f7ee2.web.app

---

## 🧪 Test Commands

### Basic Commands
```
Create a rectangle at 100, 100 with size 200x150
Create a blue circle at 300, 200 with size 100x100
Create text 'Hello World' at 500, 300
```

### Complex Commands
```
Create a login form with username, password, and login button
Build a navbar with logo and 3 menu items
Create a button with text 'Click Me' at 200, 200
```

---

## 🔧 Troubleshooting

### "Unauthorized" Error (401)
**Cause**: Firebase token verification failed
**Fix**: 
- Make sure you're logged in
- Check Lambda logs: `aws logs tail /aws/lambda/collabcanvas-ai-agent --follow`
- Verify firebase-admin is working

### "Rate limit exceeded" (429)
**Cause**: Too many requests (20/min limit)
**Fix**: Wait 1 minute or increase limit in `aws-lambda/src/middleware/rateLimit.ts`

### "Failed to retrieve API key" (500)
**Cause**: Secrets Manager access denied
**Fix**: 
- Go to Lambda → Configuration → Permissions → Execution role
- Add `SecretsManagerReadWrite` policy
- Verify secret name: `collabcanvas-openai-key`

### Command bar doesn't open
**Cause**: Keyboard shortcut not registered
**Fix**: 
- Make sure you're focused on the canvas (click on it first)
- Try clicking outside any input fields
- Check browser console for errors

### Commands don't work
**Cause**: API URL not set or incorrect
**Fix**:
- Check `.env` file exists and has `VITE_AI_API_URL`
- Restart dev server after changing `.env`
- Verify URL format (should end with `/ai/command`)

### High latency (>5s)
**Cause**: GPT-4 is slower
**Fix**: 
- Change to GPT-3.5 in `aws-lambda/src/aiAgent.ts`:
  ```typescript
  modelName: 'gpt-3.5-turbo'  // Already set!
  ```

### CORS Error
**Cause**: API Gateway CORS not configured
**Fix**:
- Go to API Gateway → Your API → CORS
- Add origin: `https://collabcanvas-f7ee2.web.app`
- For local testing, also add: `http://localhost:5173`

---

## 📊 Monitor Costs

View CloudWatch logs:
```bash
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```

Check Lambda invocations:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=collabcanvas-ai-agent \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

Expected costs:
- **AWS**: ~$0.50/month (Lambda + API Gateway + Secrets Manager)
- **OpenAI**: ~$1.50/month (GPT-3.5, 100 commands/day)
- **Total**: ~$2/month

---

## ✅ Success Checklist

- [ ] AWS account created and CLI configured
- [ ] OpenAI API key stored in Secrets Manager
- [ ] Lambda function created with correct settings
- [ ] API Gateway created with CORS configured
- [ ] Lambda code deployed successfully
- [ ] Frontend `.env` file updated with API URL
- [ ] Command bar opens with Ctrl+/
- [ ] Test commands work (rectangle, circle, text)
- [ ] Complex commands work (login form)
- [ ] CloudWatch logs show requests
- [ ] Production deployment works

---

## 📚 Next Steps

After basic setup works:

1. **Add Toast Notifications**: Show success/error messages for AI commands
2. **Add Progress Indicators**: Show which tool is being executed
3. **Implement Undo/Redo**: Track AI operations in history
4. **Components Support**: Implement makeComponent and instantiateComponent tools
5. **Optimize Performance**: Cache common commands, reduce latency
6. **Add Analytics**: Track most common commands, success rate

---

## 📖 Documentation

- **Full Implementation Plan**: `AI_AGENT_AWS_IMPLEMENTATION_PLAN.md`
- **Quick Start Guide**: `AI_AGENT_AWS_QUICK_START.md`
- **Architecture Diagrams**: `AI_AGENT_ARCHITECTURE.md`
- **Progress Checklist**: `AI_AGENT_CHECKLIST.md`
- **Cost Comparison**: `FIREBASE_VS_AWS_COMPARISON.md`

---

## 🆘 Need Help?

Check the detailed guides in the repository:
- `AI_AGENT_AWS_IMPLEMENTATION_PLAN.md` - Complete code and explanations
- `AI_AGENT_AWS_QUICK_START.md` - Condensed setup guide
- `AI_AGENT_CHECKLIST.md` - Step-by-step checklist

Or check CloudWatch logs for errors:
```bash
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```

Good luck! 🚀


