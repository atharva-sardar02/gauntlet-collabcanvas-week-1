# AI Agent Architecture Diagram

## High-Level Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Firebase Hosting (Free Tier)                       │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │         CollabCanvas React App                           │  │ │
│  │  │  • Canvas UI (Konva)                                     │  │ │
│  │  │  • Command Bar (Ctrl+/)                                  │  │ │
│  │  │  • AI Agent Context                                      │  │ │
│  │  └───┬──────────────────────────────────────────────────────┘  │ │
│  │      │                                                          │ │
│  │      │ 1. User types: "Create a login form"                    │ │
│  │      │ 2. Get Firebase ID token                                │ │
│  │      ▼                                                          │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │         Firebase Authentication                          │  │ │
│  │  │  • Issues ID tokens (JWT)                                │  │ │
│  │  │  • Token includes: uid, email, exp                       │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────────────┘
                         │
                         │ 3. POST /ai/command
                         │    Authorization: Bearer <Firebase-ID-Token>
                         │    Body: { command, canvasState, requestId }
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           AWS CLOUD                                  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │          API Gateway (HTTP API)                                │ │
│  │  • Endpoint: https://abc123.execute-api.us-east-1.amazonaws... │ │
│  │  • CORS: Allow Firebase Hosting origin                        │ │
│  │  • Throttling: 20 req/min per IP                              │ │
│  │  • Rate limiting: Burst = 10 requests                         │ │
│  └───┬────────────────────────────────────────────────────────────┘ │
│      │                                                               │
│      │ 4. Forwards request to Lambda                                │
│      ▼                                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │          AWS Lambda Function                                   │ │
│  │          Name: collabcanvas-ai-agent                           │ │
│  │          Runtime: Node.js 20.x                                 │ │
│  │          Memory: 512 MB                                        │ │
│  │          Timeout: 30 seconds                                   │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Handler: src/index.ts                                    │ │ │
│  │  │                                                            │ │ │
│  │  │  Step 1: Verify Firebase token                           │ │ │
│  │  │    ├─► firebase-admin.auth().verifyIdToken()             │ │ │
│  │  │    └─► Extract uid, email                                │ │ │
│  │  │                                                            │ │ │
│  │  │  Step 2: Check rate limit                                │ │ │
│  │  │    └─► In-memory counter: 20 req/min per user            │ │ │
│  │  │                                                            │ │ │
│  │  │  Step 3: Check idempotency cache                         │ │ │
│  │  │    └─► Return cached result if requestId exists          │ │ │
│  │  │                                                            │ │ │
│  │  │  Step 4: Get OpenAI API key ──────────────────────┐      │ │ │
│  │  │                                                     │      │ │ │
│  │  │  Step 5: Call LangChain AI Agent                  │      │ │ │
│  │  │    ├─► Build canvas context                       │      │ │ │
│  │  │    ├─► Define 10 tool schemas                     │      │ │ │
│  │  │    ├─► Create ChatOpenAI model ────────────┐      │      │ │ │
│  │  │    ├─► Invoke with system prompt           │      │      │ │ │
│  │  │    └─► Parse tool calls from response      │      │      │ │ │
│  │  │                                              │      │      │ │ │
│  │  │  Step 6: Cache result (5 min TTL)          │      │      │ │ │
│  │  │                                              │      │      │ │ │
│  │  │  Step 7: Return tool calls                  │      │      │ │ │
│  │  │    Example: [                                │      │      │ │ │
│  │  │      { name: 'createText', args: {...} },   │      │      │ │ │
│  │  │      { name: 'createShape', args: {...} },  │      │      │ │ │
│  │  │      { name: 'align', args: {...} }         │      │      │ │ │
│  │  │    ]                                         │      │      │ │ │
│  │  └───────────────────────────────────┬──────────┘      │      │ │ │
│  └────────────────────────────────────┬─┴─────────────────┘      │ │
│                                        │                           │ │
│                                        │                           │ │
│         ┌──────────────────────────────┴──────┐                   │ │
│         │                                      │                   │ │
│         ▼                                      ▼                   │ │
│  ┌────────────────────┐            ┌────────────────────────────┐ │ │
│  │  Secrets Manager   │            │       CloudWatch Logs      │ │ │
│  │                    │            │                            │ │ │
│  │  Secret:           │            │  Log Group:                │ │ │
│  │  collabcanvas-     │            │  /aws/lambda/              │ │ │
│  │  openai-key        │            │  collabcanvas-ai-agent     │ │ │
│  │                    │            │                            │ │ │
│  │  {                 │            │  Logs:                     │ │ │
│  │   OPENAI_API_KEY:  │            │  • User ID                 │ │ │
│  │   "sk-..."         │            │  • Command text            │ │ │
│  │  }                 │            │  • Tool calls count        │ │ │
│  │                    │            │  • Latency                 │ │ │
│  │  Cost: $0.40/mo    │            │  • Errors                  │ │ │
│  └────────────────────┘            └────────────────────────────┘ │ │
│                                                                     │ │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         │ 5. Response: { toolCalls: [...], latency: 1234 }
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER (AGAIN)                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │         CollabCanvas React App                                 │ │
│  │                                                                  │ │
│  │  6. Execute tool calls locally:                                 │ │
│  │     • createText('Username', 100, 100)                          │ │
│  │       └─► canvasContext.addShape({ type: 'text', ... })        │ │
│  │     • createShape('rectangle', 100, 150, 200, 40)               │ │
│  │       └─► canvasContext.addShape({ type: 'rectangle', ... })   │ │
│  │     • createText('Password', 100, 220)                          │ │
│  │       └─► canvasContext.addShape({ type: 'text', ... })        │ │
│  │     • createShape('rectangle', 100, 270, 200, 40)               │ │
│  │       └─► canvasContext.addShape({ type: 'rectangle', ... })   │ │
│  │     • createShape('rectangle', 150, 340, 100, 40)               │ │
│  │       └─► canvasContext.addShape({ type: 'rectangle', ... })   │ │
│  │     • createText('Login', 170, 350)                             │ │
│  │       └─► canvasContext.addShape({ type: 'text', ... })        │ │
│  │                                                                  │ │
│  │  7. Shapes created → sync to Firestore                          │ │
│  │     └─► Other users see changes in real-time                    │ │
│  │                                                                  │ │
│  │  8. Show toast: "Created login form (6 elements)"               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                         │
                         │ All changes synced via Firestore
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Firebase Firestore (Free Tier)                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  canvases/{canvasId}/shapes/{shapeId}                          │ │
│  │  • Real-time sync to all connected users                       │ │
│  │  • Presence tracking                                            │ │
│  │  • Conflict resolution (last-write-wins)                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
User                 Frontend              API Gateway      Lambda              OpenAI         Firestore
 │                      │                      │              │                   │               │
 │ 1. Ctrl+/           │                      │              │                   │               │
 ├────────────────────►│                      │              │                   │               │
 │                      │                      │              │                   │               │
 │ 2. Type command     │                      │              │                   │               │
 ├────────────────────►│                      │              │                   │               │
 │                      │                      │              │                   │               │
 │                      │ 3. Get Firebase     │              │                   │               │
 │                      │    ID token         │              │                   │               │
 │                      │                      │              │                   │               │
 │                      │ 4. POST /ai/command │              │                   │               │
 │                      │    with token        │              │                   │               │
 │                      ├─────────────────────►│              │                   │               │
 │                      │                      │              │                   │               │
 │                      │                      │ 5. Forward   │                   │               │
 │                      │                      ├─────────────►│                   │               │
 │                      │                      │              │                   │               │
 │                      │                      │              │ 6. Verify token   │               │
 │                      │                      │              │                   │               │
 │                      │                      │              │ 7. Get API key    │               │
 │                      │                      │              │    from Secrets   │               │
 │                      │                      │              │                   │               │
 │                      │                      │              │ 8. Call OpenAI    │               │
 │                      │                      │              │    with tools     │               │
 │                      │                      │              ├──────────────────►│               │
 │                      │                      │              │                   │               │
 │                      │                      │              │ 9. Tool calls     │               │
 │                      │                      │              │◄──────────────────┤               │
 │                      │                      │              │                   │               │
 │                      │                      │ 10. Response │                   │               │
 │                      │                      │◄─────────────┤                   │               │
 │                      │                      │              │                   │               │
 │                      │ 11. Tool calls JSON │              │                   │               │
 │                      │◄─────────────────────┤              │                   │               │
 │                      │                      │              │                   │               │
 │                      │ 12. Execute tools    │              │                   │               │
 │                      │     (create shapes)  │              │                   │               │
 │                      │                      │              │                   │               │
 │                      │ 13. Add shapes to    │              │                   │               │
 │                      │     Firestore        │              │                   │               │
 │                      ├──────────────────────┼──────────────┼───────────────────┼──────────────►│
 │                      │                      │              │                   │               │
 │ 14. See shapes      │                      │              │                   │               │
 │     on canvas       │                      │              │                   │               │
 │◄────────────────────┤                      │              │                   │               │
 │                      │                      │              │                   │               │
```

---

## Tool Execution Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  OpenAI Response Example                                         │
├──────────────────────────────────────────────────────────────────┤
│  {                                                                │
│    "toolCalls": [                                                 │
│      {                                                            │
│        "type": "function",                                        │
│        "function": {                                              │
│          "name": "createText",                                    │
│          "arguments": {                                           │
│            "text": "Username",                                    │
│            "x": 100,                                              │
│            "y": 100,                                              │
│            "fontSize": 14                                         │
│          }                                                        │
│        }                                                          │
│      },                                                           │
│      {                                                            │
│        "type": "function",                                        │
│        "function": {                                              │
│          "name": "createShape",                                   │
│          "arguments": {                                           │
│            "type": "rectangle",                                   │
│            "x": 100,                                              │
│            "y": 120,                                              │
│            "width": 200,                                          │
│            "height": 40,                                          │
│            "fill": "#FFFFFF",                                     │
│            "stroke": "#000000"                                    │
│          }                                                        │
│        }                                                          │
│      },                                                           │
│      ...more tool calls...                                        │
│    ],                                                             │
│    "latency": 1234                                                │
│  }                                                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Frontend receives response
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  executeToolCalls() Function                                     │
├──────────────────────────────────────────────────────────────────┤
│  for (const toolCall of toolCalls) {                             │
│    switch (toolCall.function.name) {                             │
│                                                                   │
│      case 'createShape':                                         │
│        canvasContext.addShape({                                  │
│          type: args.type,         // 'rectangle'                 │
│          x: args.x,               // 100                         │
│          y: args.y,               // 120                         │
│          width: args.width,       // 200                         │
│          height: args.height,     // 40                          │
│          fill: args.fill,         // '#FFFFFF'                   │
│        });                                                        │
│        break;                                                     │
│                                                                   │
│      case 'createText':                                          │
│        canvasContext.addShape({                                  │
│          type: 'text',                                           │
│          text: args.text,         // 'Username'                  │
│          x: args.x,               // 100                         │
│          y: args.y,               // 100                         │
│          fontSize: args.fontSize, // 14                          │
│        });                                                        │
│        break;                                                     │
│                                                                   │
│      case 'align':                                               │
│        canvasContext.alignShapes(args.ids, args.mode);           │
│        break;                                                     │
│                                                                   │
│      // ... handle other tools ...                               │
│    }                                                              │
│  }                                                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Each tool call triggers Firestore update
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Firestore Update                                                │
├──────────────────────────────────────────────────────────────────┤
│  canvases/{canvasId}/shapes/{shapeId1}  ← createText            │
│  canvases/{canvasId}/shapes/{shapeId2}  ← createShape           │
│  canvases/{canvasId}/shapes/{shapeId3}  ← createText            │
│  canvases/{canvasId}/shapes/{shapeId4}  ← createShape           │
│  ...                                                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Real-time sync
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  All Connected Users See Changes Immediately                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Security Model

```
┌──────────────────────────────────────────────────────────────────┐
│  1. Authentication (Firebase)                                    │
├──────────────────────────────────────────────────────────────────┤
│  • User logs in via Firebase Auth                               │
│  • Firebase issues JWT ID token                                 │
│  • Token contains: uid, email, expiration                       │
│  • Token expires after 1 hour (auto-refresh)                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Authorization Header                                         │
├──────────────────────────────────────────────────────────────────┤
│  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6...          │
│                                                                   │
│  • Sent with every AI command request                           │
│  • Verified by Lambda before processing                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Token Verification (Lambda)                                  │
├──────────────────────────────────────────────────────────────────┤
│  const decodedToken = await admin.auth().verifyIdToken(token);  │
│                                                                   │
│  Checks:                                                         │
│  ✓ Token signature (Firebase public key)                        │
│  ✓ Token not expired                                             │
│  ✓ Token issued by correct Firebase project                     │
│  ✓ Token audience matches                                        │
│                                                                   │
│  If invalid → 401 Unauthorized                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. Rate Limiting (Per User)                                     │
├──────────────────────────────────────────────────────────────────┤
│  • Track requests by user ID (uid)                              │
│  • Limit: 20 requests per minute                                │
│  • Sliding window: resets after 60 seconds                      │
│  • If exceeded → 429 Too Many Requests                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. API Key Security (Secrets Manager)                          │
├──────────────────────────────────────────────────────────────────┤
│  • OpenAI API key stored in AWS Secrets Manager                 │
│  • NOT in code, NOT in environment variables                    │
│  • Lambda IAM role grants read access                           │
│  • Retrieved at runtime: getSecret(SECRET_NAME)                 │
│  • Never exposed to frontend                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. CORS Protection (API Gateway)                                │
├──────────────────────────────────────────────────────────────────┤
│  Access-Control-Allow-Origin: https://collabcanvas-f7ee2.web... │
│  Access-Control-Allow-Headers: Authorization, Content-Type       │
│  Access-Control-Allow-Methods: POST, OPTIONS                     │
│                                                                   │
│  • Only Firebase Hosting origin allowed                         │
│  • Prevents unauthorized websites from calling API              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown

```
┌─────────────────────────────────────────────────────────────────┐
│  AWS Costs (Monthly)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Lambda                                                          │
│  ├─ Free Tier: 1M requests/month                                │
│  ├─ Estimate: 30,000 requests/month (1,000/day)                 │
│  ├─ After free tier: $0.20 per 1M requests                      │
│  └─ Cost: $0.01/month                                            │
│                                                                  │
│  API Gateway (HTTP API)                                          │
│  ├─ Free Tier: 1M requests/month (first 12 months)              │
│  ├─ After free tier: $1.00 per 1M requests                      │
│  └─ Cost: $0.03/month                                            │
│                                                                  │
│  Secrets Manager                                                 │
│  ├─ $0.40/month per secret                                       │
│  ├─ 1 secret (OPENAI_API_KEY)                                    │
│  └─ Cost: $0.40/month                                            │
│                                                                  │
│  CloudWatch Logs                                                 │
│  ├─ Free Tier: 5 GB ingestion/month                             │
│  ├─ Estimate: < 1 GB/month                                       │
│  └─ Cost: $0.00/month                                            │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Total AWS: ~$0.50/month (after free tier)                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  OpenAI Costs (Variable)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GPT-4 Turbo                                                     │
│  ├─ Input: $0.01 per 1K tokens                                  │
│  ├─ Output: $0.03 per 1K tokens                                 │
│  ├─ Avg command: 500 input + 200 output tokens                  │
│  ├─ Cost per command: $0.01                                      │
│  └─ 100 commands/day = $1.00/day = $30/month                    │
│                                                                  │
│  GPT-3.5 Turbo (Recommended for cost)                            │
│  ├─ Input: $0.0005 per 1K tokens                                │
│  ├─ Output: $0.0015 per 1K tokens                               │
│  ├─ Avg command: 500 input + 200 output tokens                  │
│  ├─ Cost per command: $0.0005                                    │
│  └─ 100 commands/day = $0.05/day = $1.50/month                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Total with GPT-3.5: ~$2.00/month                          │  │
│  │  Total with GPT-4: ~$30.50/month                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparison: Firebase Functions vs AWS Lambda

```
┌─────────────────────────┬────────────────────┬────────────────────┐
│ Feature                 │ Firebase Functions │ AWS Lambda         │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Free Tier               │ 125K invocations   │ 1M requests        │
│                         │ 40 GB-sec compute  │ 400K GB-sec        │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Requires Paid Plan      │ YES (Blaze)        │ NO                 │
│ for External APIs       │ ($0.40/GB)         │                    │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Cost at 30K req/month   │ ~$5-10/month       │ ~$0.50/month       │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Setup Complexity        │ Easy               │ Medium             │
│                         │ (firebase deploy)  │ (AWS Console)      │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Monitoring              │ Firebase Console   │ CloudWatch         │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Secrets Management      │ firebase functions │ Secrets Manager    │
│                         │ :secrets:set       │ ($0.40/month)      │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Cold Start              │ ~1-2s              │ ~1-2s              │
├─────────────────────────┼────────────────────┼────────────────────┤
│ Recommendation          │ Good for           │ ✓ Best for         │
│                         │ Firebase-only apps │ external APIs      │
└─────────────────────────┴────────────────────┴────────────────────┘
```

---

## Why This Architecture?

### ✅ Advantages
1. **Avoid Firebase Blaze Plan**: Stay on free tier for Firebase
2. **Cost-Effective**: ~$2/month total (AWS + OpenAI GPT-3.5)
3. **Secure**: API keys in AWS Secrets Manager, never exposed
4. **Scalable**: Auto-scales with AWS Lambda
5. **Isolated**: Backend separate from frontend, easier to maintain
6. **Flexible**: Easy to swap AI providers (OpenAI → Anthropic → etc.)
7. **Monitoring**: CloudWatch provides detailed logs and metrics

### ⚠️ Trade-offs
1. **Setup Complexity**: Requires AWS account and configuration
2. **Two Cloud Providers**: Firebase + AWS (instead of just Firebase)
3. **Cold Starts**: ~1-2s initial latency (can be mitigated with provisioned concurrency)

### 🎯 Best For
- Projects with external API calls (OpenAI, Anthropic, etc.)
- Cost-conscious deployments
- Need for flexible backend logic
- Long-term scalability


