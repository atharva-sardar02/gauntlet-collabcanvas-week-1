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
- Zod: ^4.x (schema validation)
- firebase-admin: ^12.x (token verification)
- @aws-sdk/client-secrets-manager: API key storage
- Deployment: AWS Lambda + API Gateway (HTTP API)
- Monitoring: CloudWatch Logs

Constraints
- Browser-based SPA; prioritize performance and real-time updates.
- AI Agent: Use AWS Lambda to avoid Firebase Blaze plan requirement.

