## Tech Context

Stack
- React + TypeScript via Vite
- Firebase (Auth, Firestore/RTDB as applicable)
- Konva / react-konva for canvas rendering
- Tailwind CSS

Key versions (from package.json)
- react: ^19.1.1
- react-dom: ^19.1.1
- typescript: ~5.9.3
- vite: ^7.1.7
- firebase: ^12.4.0
- konva: ^10.0.2
- react-konva: ^19.0.10
- tailwindcss: ^4.1.14
- postcss: ^8.5.6
- eslint: ^9.36.0

Local development
- Node: use version compatible with Vite 7 and TypeScript 5.9
- Scripts: dev, build, lint, preview (see package.json)

AI Agent Stack (AWS Lambda)
- Runtime: Node.js 20.x on AWS Lambda
- LangChain: ^0.1.x (AI framework)
- OpenAI: ^6.x (LLM provider)
- Model: gpt-4o-mini (optimized for speed + cost)
- Zod: ^4.x (schema validation)
- firebase-admin: ^12.x (token verification)
- @aws-sdk/client-secrets-manager: API key storage
- Deployment: AWS Lambda + API Gateway (HTTP API)
- Monitoring: CloudWatch Logs
- Performance: 2-3x faster than initial implementation
- Cost: ~$0.80/month for OpenAI API (60% reduction)

Constraints
- Browser-based SPA; prioritize performance and real-time updates.
- AI Agent: Use AWS Lambda to avoid Firebase Blaze plan requirement.

Performance Characteristics
- AI Command Latency: 1-4 seconds (depending on complexity)
- Simple commands (create shape): ~1-1.5s
- Medium commands (50 shapes): ~1.5-2.5s
- Large commands (1500 shapes): ~2-4s
- Modify commands (move/resize): ~1.5-2s
- Lambda memory: 512 MB (sufficient for up to 2000 shape operations)
- Lambda timeout: 30 seconds (AI timeout: 15 seconds)

