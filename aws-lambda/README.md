# CollabCanvas AI Agent - AWS Lambda

This Lambda function handles AI canvas commands using LangChain and OpenAI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up AWS credentials:
```bash
aws configure
```

3. Create OpenAI API key secret:
```bash
aws secretsmanager create-secret \
  --name collabcanvas-openai-key \
  --description "OpenAI API key for CollabCanvas" \
  --secret-string '{"OPENAI_API_KEY":"sk-YOUR-KEY-HERE"}'
```

4. Create Lambda function (via AWS Console):
   - Function name: `collabcanvas-ai-agent`
   - Runtime: Node.js 20.x
   - Memory: 512 MB
   - Timeout: 30 seconds
   - Environment variables:
     - `SECRET_NAME=collabcanvas-openai-key`
     - `NODE_ENV=production`
   - Permissions: Add `SecretsManagerReadWrite` policy

5. Create API Gateway:
   - Type: HTTP API
   - Route: `POST /ai/command`
   - Integration: Lambda proxy
   - CORS: Allow Firebase Hosting origin

## Build

```bash
npm run build
```

## Deploy

```bash
npm run deploy
```

## View Logs

```bash
npm run logs
```

## Architecture

```
API Gateway → Lambda → OpenAI
              ↓
         Secrets Manager
              ↓
         CloudWatch Logs
```

## Environment Variables

Set in AWS Lambda Console:
- `SECRET_NAME`: Name of secret in Secrets Manager (default: `collabcanvas-openai-key`)
- `NODE_ENV`: Environment (default: `production`)

## Cost

- Lambda: ~$0.01/month (within free tier for 30K requests)
- API Gateway: ~$0.03/month (after first year free tier)
- Secrets Manager: $0.40/month
- Total: ~$0.50/month


