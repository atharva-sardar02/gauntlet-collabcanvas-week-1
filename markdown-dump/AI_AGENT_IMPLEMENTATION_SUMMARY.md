# AI Agent Implementation Summary

## Executive Summary

We're implementing an AI Canvas Agent using **LangChain on AWS Lambda** instead of Firebase Functions to avoid the Firebase Blaze (paid) plan requirement. This architecture keeps your frontend on Firebase's free tier while leveraging AWS's generous free tier for the AI backend.

## Key Documents Created

1. **AI_AGENT_AWS_IMPLEMENTATION_PLAN.md** - Detailed technical implementation guide (46 pages)
   - Complete code samples for all components
   - Step-by-step setup instructions
   - Security best practices
   - Cost analysis
   - Troubleshooting guide

2. **AI_AGENT_AWS_QUICK_START.md** - Condensed setup guide (30 minutes)
   - Quick setup commands
   - Testing checklist
   - Environment variables reference
   - Common troubleshooting

3. **AI_AGENT_ARCHITECTURE.md** - Visual architecture diagrams
   - High-level flow diagram
   - Data flow sequence
   - Tool execution flow
   - Security model
   - Cost breakdown

## Architecture Overview

```
Firebase Hosting (Free Tier)
    ↓
AWS API Gateway (HTTP API)
    ↓
AWS Lambda (Node.js 20)
    ├─→ Firebase Admin (verify token)
    ├─→ AWS Secrets Manager (get OpenAI key)
    ├─→ LangChain + OpenAI (execute AI command)
    └─→ CloudWatch Logs (monitoring)
    ↓
Return tool calls to frontend
    ↓
Frontend executes tools locally
    ↓
Canvas updates sync via Firestore
```

## Why This Approach?

### Problem
Firebase Functions require the **Blaze (pay-as-you-go) plan** to make external API calls (like OpenAI). Even small usage can result in unpredictable costs.

### Solution
Use AWS Lambda instead:
- ✅ **Free Tier**: 1M requests/month (vs Firebase's 125K)
- ✅ **No Paid Plan Required**: AWS free tier includes external API calls
- ✅ **Predictable Costs**: ~$2/month after free tier (AWS $0.50 + OpenAI $1.50)
- ✅ **Better Security**: Secrets Manager for API keys
- ✅ **Superior Monitoring**: CloudWatch Logs with detailed metrics

## Implementation Phases

### Phase 1: AWS Infrastructure (1-2 hours)
- [ ] Create AWS account
- [ ] Install AWS CLI
- [ ] Store OpenAI API key in Secrets Manager
- [ ] Create Lambda function
- [ ] Create API Gateway HTTP API
- [ ] Configure CORS

### Phase 2: Backend Lambda Code (3-4 hours)
- [ ] Initialize Lambda project (`aws-lambda/`)
- [ ] Install dependencies (langchain, openai, zod, firebase-admin)
- [ ] Define 10 tool schemas (Zod)
- [ ] Implement Firebase token verification
- [ ] Implement LangChain agent with OpenAI
- [ ] Add rate limiting (20 req/min per user)
- [ ] Add idempotency caching
- [ ] Build and deploy to AWS

### Phase 3: Frontend Integration (2-3 hours)
- [ ] Create AI agent service (`src/services/aiAgent.ts`)
- [ ] Create AI agent context (`src/contexts/AIAgentContext.tsx`)
- [ ] Create command bar component (`src/components/Canvas/CommandBar.tsx`)
- [ ] Add keyboard shortcut (Ctrl+/)
- [ ] Integrate with canvas context
- [ ] Add toast notifications

### Phase 4: Testing (1-2 hours)
- [ ] Test basic commands (create, move, resize)
- [ ] Test complex commands (login form, navbar)
- [ ] Test rate limiting
- [ ] Test idempotency
- [ ] Monitor CloudWatch logs

### Phase 5: Documentation (1 hour)
- [ ] Update README with AWS setup
- [ ] Create environment variable examples
- [ ] Document troubleshooting steps

## Total Estimated Time
**8-12 hours** for complete implementation

## 10 AI Tools

The AI agent can call these 10 functions:

1. **createShape** - Create rectangle, circle, triangle, or star
   - Example: "Create a blue rectangle at 100, 100"

2. **moveShape** - Move existing shape
   - Example: "Move shape X to 300, 400"

3. **resizeShape** - Resize existing shape
   - Example: "Make shape X 200x150"

4. **rotateShape** - Rotate shape by degrees
   - Example: "Rotate shape X by 45 degrees"

5. **align** - Align multiple shapes
   - Modes: left, right, top, bottom, center-h, center-v
   - Example: "Align selected shapes to the left"

6. **distribute** - Distribute shapes evenly
   - Axes: horizontal, vertical
   - Example: "Distribute shapes horizontally"

7. **createText** - Create text element
   - Example: "Add text 'Hello World' at 500, 300"

8. **makeComponent** - Create reusable component (future)
   - Example: "Make a button component from selection"

9. **instantiateComponent** - Create component instance (future)
   - Example: "Add button component at 200, 200"

10. **export** - Export canvas or selection as PNG
    - Example: "Export selected shapes as PNG"

## Example Commands

### Basic Commands
```
"Create a rectangle at 100, 100 with size 200x150"
"Create a blue circle at 300, 200 with size 100x100"
"Create text 'Hello World' at 500, 300"
"Align selected shapes to the left"
```

### Complex Commands
```
"Create a login form with username field, password field, and login button"
→ AI generates: 6 tool calls (3 text labels + 2 input backgrounds + 1 button)

"Build a navbar with logo on left and 3 menu items on right"
→ AI generates: 4+ tool calls arranged horizontally

"Create a button with text 'Click Me' centered at 200, 200"
→ AI generates: 2 tool calls (rectangle + text, aligned)
```

## Cost Analysis

### AWS Costs (Monthly)
- **Lambda**: $0.01 (30K requests, well within 1M free tier)
- **API Gateway**: $0.03 (30K requests)
- **Secrets Manager**: $0.40 (1 secret)
- **CloudWatch**: $0.00 (within 5 GB free tier)
- **TOTAL AWS**: ~**$0.50/month**

### OpenAI Costs (Monthly, 100 commands/day)
- **GPT-4 Turbo**: ~$30/month ($0.01 per command)
- **GPT-3.5 Turbo**: ~$1.50/month ($0.0005 per command) ✅ **Recommended**

### Total Cost
- **With GPT-3.5**: ~**$2/month**
- **With GPT-4**: ~$31/month

### Comparison to Firebase
- **Firebase Functions** (Blaze plan): Unknown, variable costs for external APIs + $0.40/GB network egress
- **AWS Lambda**: Predictable, ~$2/month total

## Security Features

1. **Firebase Authentication**
   - Users must be logged in
   - ID token sent with every request

2. **Token Verification**
   - Lambda verifies Firebase token using `firebase-admin`
   - Extracts user ID, email
   - Rejects invalid/expired tokens (401)

3. **API Key Protection**
   - OpenAI key stored in AWS Secrets Manager
   - Never exposed to frontend
   - Retrieved at runtime by Lambda

4. **Rate Limiting**
   - 20 requests per minute per user
   - Prevents abuse and excessive OpenAI costs
   - Returns 429 if exceeded

5. **Idempotency**
   - Caches responses by `requestId` (5 min TTL)
   - Prevents duplicate operations on retry
   - Returns cached result if requestId seen before

6. **CORS**
   - Only Firebase Hosting origin allowed
   - Prevents unauthorized websites from calling API

## Performance

### Latency Targets
- **Simple commands** (1-3 tool calls): <2s
- **Complex commands** (4-10 tool calls): <5s
- **Cold start**: ~1-2s (first request)
- **Warm start**: ~200-500ms (subsequent requests)

### Optimization Tips
1. Use GPT-3.5 Turbo instead of GPT-4 (3x faster, 60x cheaper)
2. Increase Lambda memory (more memory = more CPU)
3. Use provisioned concurrency to eliminate cold starts ($$$)
4. Cache common commands client-side

## Testing Checklist

### ✅ Basic Functionality
- [ ] Command bar opens with Ctrl+/
- [ ] Can type and submit commands
- [ ] Loading indicator shows during processing
- [ ] Toast notifications for success/failure
- [ ] Command history (arrow up/down)

### ✅ AI Commands
- [ ] "Create a rectangle at 100, 100 with size 200x150"
- [ ] "Create a blue circle at 300, 200 with size 100x100"
- [ ] "Create text 'Hello' at 500, 300"
- [ ] "Create 3 rectangles in a row starting at 100, 100"

### ✅ Complex Commands
- [ ] "Create a login form with username, password, and login button"
- [ ] "Build a navbar with logo and 3 menu items"
- [ ] Verify elements arranged neatly
- [ ] Verify consistent spacing

### ✅ Security
- [ ] Cannot call API without authentication (401)
- [ ] Rate limit kicks in after 20 requests (429)
- [ ] Retry with same requestId returns cached result

### ✅ Error Handling
- [ ] Invalid command shows error toast
- [ ] OpenAI API error shows user-friendly message
- [ ] Network errors handled gracefully

### ✅ Collaboration
- [ ] AI-generated shapes sync to other users
- [ ] Other users see changes in real-time
- [ ] No conflicts with manual edits

## Monitoring

### CloudWatch Logs
View logs:
```bash
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```

Logged information:
- User ID (uid)
- Command text (first 100 chars)
- Tool calls count
- Latency (ms)
- Errors with stack traces

### Metrics to Monitor
- **Invocation count**: Track usage trends
- **Duration**: Average execution time
- **Errors**: Failed requests
- **Throttles**: Rate limit violations
- **Cold starts**: Initial latency spikes

### Alerts (Optional)
Set up CloudWatch alarms for:
- Error rate > 5%
- Average duration > 10s
- Invocations > 1000/hour (cost control)

## Next Steps After Basic Implementation

### Short-term (Week 1-2)
1. **UI Polish**:
   - Command suggestions panel
   - Progress bar for multi-step commands
   - Better error messages

2. **Advanced Commands**:
   - Multi-step planning (AI breaks complex commands into steps)
   - Streaming progress updates
   - Confirmation dialog for large operations (10+ shapes)

3. **Undo/Redo Integration**:
   - Track AI operations in history
   - Allow undo of AI-generated changes

### Mid-term (Week 3-4)
4. **Performance Optimization**:
   - Switch to GPT-3.5 Turbo for faster responses
   - Client-side caching of common commands
   - Batch tool calls for efficiency

5. **Analytics**:
   - Track most common commands
   - Monitor success rate
   - Identify problematic prompts

6. **Components Support**:
   - Implement makeComponent tool
   - Implement instantiateComponent tool
   - Allow AI to create reusable components

### Long-term (Month 2+)
7. **Multi-Region Deployment**:
   - Deploy Lambda to multiple AWS regions
   - Route users to nearest region (lower latency)

8. **Advanced AI Features**:
   - Context-aware commands ("create 3 more like this")
   - Natural language canvas queries ("what's at 100, 100?")
   - Smart layout suggestions

9. **Alternative AI Providers**:
   - Support Anthropic Claude
   - Support Google Gemini
   - Allow users to choose provider

## Troubleshooting

### "Unauthorized" Error (401)
**Symptom**: All AI commands fail with 401
**Cause**: Firebase token verification failed
**Fix**:
1. Verify user is logged in
2. Check Lambda logs for error details
3. Ensure `firebase-admin` is initialized correctly
4. Verify Lambda has correct Firebase project credentials

### "Rate limit exceeded" Error (429)
**Symptom**: AI commands fail after 20 requests in 1 minute
**Cause**: Rate limit protection triggered
**Fix**:
1. Wait 1 minute for rate limit to reset
2. Or increase limit in `src/middleware/rateLimit.ts` (change 20 to higher number)

### "Failed to retrieve API key" Error
**Symptom**: Lambda fails to get OpenAI key
**Cause**: Secrets Manager access denied
**Fix**:
1. Go to Lambda → Configuration → Permissions → Execution role
2. Add policy: `SecretsManagerReadWrite`
3. Verify secret name: `collabcanvas-openai-key`
4. Check environment variable: `SECRET_NAME=collabcanvas-openai-key`

### High Latency (>5s)
**Symptom**: AI commands take too long
**Cause**: GPT-4 is slower, cold starts, or complex prompts
**Fix**:
1. Switch to GPT-3.5 Turbo (3x faster)
2. Increase Lambda memory (512 MB → 1024 MB)
3. Use provisioned concurrency ($$$ but eliminates cold starts)
4. Simplify system prompt

### CORS Error
**Symptom**: Frontend cannot call API Gateway
**Cause**: CORS not configured correctly
**Fix**:
1. Go to API Gateway → Your API → CORS
2. Add origin: `https://collabcanvas-f7ee2.web.app` (exact match)
3. Add headers: `Authorization, Content-Type`
4. Add methods: `POST, OPTIONS`
5. Redeploy API

### Lambda Timeout (30s)
**Symptom**: Complex commands fail with timeout
**Cause**: OpenAI call taking too long
**Fix**:
1. Check OpenAI API status (outage?)
2. Simplify command (break into smaller parts)
3. Increase Lambda timeout (Configuration → 60s)
4. Check for infinite loops in code

## Resources

### Documentation
- **AWS Lambda**: https://docs.aws.amazon.com/lambda/
- **API Gateway**: https://docs.aws.amazon.com/apigateway/
- **LangChain**: https://js.langchain.com/docs
- **OpenAI Function Calling**: https://platform.openai.com/docs/guides/function-calling
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup

### AWS Consoles
- **Lambda Functions**: https://console.aws.amazon.com/lambda
- **API Gateway**: https://console.aws.amazon.com/apigateway
- **Secrets Manager**: https://console.aws.amazon.com/secretsmanager
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch

### Cost Calculators
- **AWS Pricing Calculator**: https://calculator.aws/
- **OpenAI Pricing**: https://openai.com/pricing

## Files to Create

### Backend (aws-lambda/)
```
aws-lambda/
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── src/
│   ├── index.ts                          # Lambda handler (main entry point)
│   ├── aiAgent.ts                        # LangChain agent logic
│   ├── auth/
│   │   └── firebaseAuth.ts               # Firebase token verification
│   ├── middleware/
│   │   ├── rateLimit.ts                  # Per-user rate limiting
│   │   └── idempotency.ts                # Request deduplication cache
│   ├── schemas/
│   │   └── tools.ts                      # Zod schemas for 10 tools
│   └── utils/
│       ├── secrets.ts                    # AWS Secrets Manager client
│       └── logger.ts                     # Structured logging helpers
└── dist/                                 # Compiled JS (deploy this)
```

### Frontend (src/)
```
src/
├── services/
│   └── aiAgent.ts                        # NEW: AWS API Gateway client
├── contexts/
│   └── AIAgentContext.tsx                # NEW: AI agent state management
├── components/
│   └── Canvas/
│       └── CommandBar.tsx                # NEW: AI command bar UI (Ctrl+/)
├── hooks/
│   └── useAIAgent.ts                     # NEW: Hook for AI commands
└── App.tsx                               # UPDATE: Add AIAgentProvider
```

### Environment Variables
```
# Frontend (.env)
VITE_AI_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/ai/command

# Lambda (AWS Console)
SECRET_NAME=collabcanvas-openai-key
NODE_ENV=production
```

## Quick Start Command Sequence

```bash
# 1. AWS Setup
aws configure
aws secretsmanager create-secret --name collabcanvas-openai-key --secret-string '{"OPENAI_API_KEY":"sk-..."}'

# 2. Create Lambda Project
mkdir aws-lambda && cd aws-lambda
npm init -y
npm install langchain @langchain/openai @langchain/core zod firebase-admin @aws-sdk/client-secrets-manager
npm install -D typescript @types/node esbuild

# 3. Copy code from AI_AGENT_AWS_IMPLEMENTATION_PLAN.md sections 2.2-2.8

# 4. Build and deploy
npm run build
cd dist && zip -r function.zip . && cd ..
aws lambda update-function-code --function-name collabcanvas-ai-agent --zip-file fileb://dist/function.zip

# 5. Update frontend
cd ../  # Back to project root
echo "VITE_AI_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/ai/command" >> .env

# 6. Copy frontend code from plan sections 3.1-3.5

# 7. Test
npm run dev
# Open browser, press Ctrl+/, type command
```

## Success Criteria

### MVP (Minimum Viable Product)
✅ Command bar opens with Ctrl+/
✅ Can execute basic commands (create, move, resize)
✅ AI-generated shapes appear on canvas
✅ Other users see changes in real-time
✅ Rate limiting and security work

### Production Ready
✅ All 10 tools work correctly
✅ Complex commands (login form, navbar) work
✅ Latency <2s for simple commands, <5s for complex
✅ Error handling with user-friendly messages
✅ CloudWatch logs show all requests
✅ Cost tracking set up
✅ Documentation complete

### Future Enhancements
⬜ Streaming progress updates
⬜ Undo/redo for AI operations
⬜ Command suggestions and autocomplete
⬜ Components support (makeComponent, instantiateComponent)
⬜ Multi-region deployment
⬜ Analytics dashboard

## Conclusion

This AWS Lambda architecture provides a **cost-effective, scalable, and secure** solution for the AI Canvas Agent, avoiding Firebase's paid plan requirement while maintaining excellent performance and user experience.

**Total implementation time**: 8-12 hours
**Total monthly cost**: ~$2 (AWS $0.50 + OpenAI GPT-3.5 $1.50)
**Scalability**: Handles 1M requests/month on free tier

All detailed implementation steps are in `AI_AGENT_AWS_IMPLEMENTATION_PLAN.md`.
Quick setup guide is in `AI_AGENT_AWS_QUICK_START.md`.
Architecture diagrams are in `AI_AGENT_ARCHITECTURE.md`.

Ready to start implementing! 🚀


