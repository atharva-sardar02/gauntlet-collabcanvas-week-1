# CollabCanvas MVP

> 🎨 An AI-powered, real-time collaborative canvas application built with React, TypeScript, Firebase, Konva, and AWS Lambda. Multiple users can create, move, and delete shapes using natural language AI commands on a shared canvas with live cursor tracking and presence awareness.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://collabcanvas-f7ee2.web.app)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-Node.js_20-orange)](https://aws.amazon.com/lambda/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-green)](https://openai.com/)
[![Vite](https://img.shields.io/badge/Vite-7-purple)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)](https://tailwindcss.com/)

🔗 **[Launch App](https://collabcanvas-f7ee2.web.app)** | Built for Gauntlet AI Challenge

## 🚀 Features

### ✅ Fully Implemented & Deployed

- **🤖 AI-Powered Canvas Commands** ⭐ **NEW**
  - Natural language commands to create and manipulate shapes
  - "Create a grid of 50 circles" - instantly generates shapes
  - "Move the blue rectangle to center" - smart shape selection
  - "Make the text bigger" - contextual modifications
  - Powered by OpenAI GPT-4o-mini via AWS Lambda
  - Supports up to 2000 shapes in a single command
  - Smart color keyword mapping (red, blue, green, etc.)
  - Intelligent layout understanding (avoids breaking complex designs)

- **🎨 Interactive Canvas**
  - Infinite 5000x5000px canvas with smooth pan and zoom
  - Grid background for better spatial awareness
  - Dark mode UI for comfortable extended use
  - Tool-based workflow with dedicated toolbox
  - Layers panel for visual hierarchy management
  - Drag-and-drop layer reordering
  - Undo/redo functionality (Ctrl+Z / Ctrl+Y)

- **🔧 Shape Creation & Management**
  - Create shapes: rectangles, circles, triangles, stars, text
  - Click and drag to define shape size
  - Select, move, resize, rotate, and delete shapes
  - Duplicate shapes (Ctrl+D / Cmd+D)
  - Rich shape properties: color, opacity, blend modes, rotation
  - Advanced alignment tools (left, center, right, top, middle, bottom)
  - Distribution tools (horizontal/vertical spacing)
  - Visual feedback for selected shapes
  - Bring forward/backward, send to front/back

- **📋 Layers Panel** ⭐ **NEW**
  - Visual list of all shapes on canvas
  - Drag-and-drop to reorder layers (changes z-index)
  - Show/hide shapes with visibility toggle
  - Rename layers for better organization
  - Quick layer navigation (click to select on canvas)
  - Auto-generated names for AI-created shapes
  - Smart icon colors (visible even for dark shapes)
  - Compact, collapsible interface

- **👥 Real-time Collaboration**
  - Multiple users can edit the canvas simultaneously
  - Automatic object locking when shapes are being edited
  - Server-authoritative updates prevent conflicts
  - Offline persistence with automatic sync on reconnection
  - Live shape synchronization across all connected users

- **🖱️ Multiplayer Cursors**
  - See other users' cursors in real-time
  - Cursor positions tracked relative to canvas (zoom/pan aware)
  - Name labels show who's where
  - Color-coded cursors for easy identification
  - Optimized updates (25 FPS, 2px movement threshold)

- **👤 User Presence System**
  - Live user count shows active collaborators
  - Expandable presence list with user avatars
  - Color-coded initials for each user
  - Automatic cleanup when users disconnect

- **🔐 User Authentication**
  - Email/password authentication
  - Google sign-in integration
  - Display name truncation for long names
  - Protected routes for authenticated users
  - Persistent sessions with Firebase Auth
  - Secure Firebase ID token verification

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Canvas Rendering**: Konva 10 + React Konva 19
- **Styling**: Tailwind CSS 4 with PostCSS

### Backend & Services
- **Authentication**: Firebase Authentication (Email/Password + Google OAuth)
- **Database**: 
  - Firebase Firestore (shape data persistence & real-time sync)
  - Firebase Realtime Database (cursor positions & presence data)
- **AI Backend**: AWS Lambda (Node.js 20.x)
  - LangChain 0.2 for agentic workflows
  - OpenAI GPT-4o-mini for natural language understanding
  - Zod for schema validation
  - Firebase Admin SDK for auth verification
- **API Gateway**: AWS API Gateway (HTTP API with CORS)
- **Secrets Management**: AWS Secrets Manager (OpenAI API key)
- **Hosting**: Firebase Hosting ✅ **Deployed & Live**

### Infrastructure
- **Frontend**: Firebase Hosting (CDN, HTTPS, custom domain support)
- **Backend**: AWS Lambda (serverless, auto-scaling)
- **Monitoring**: AWS CloudWatch (logs, metrics, alarms)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### For Frontend Development
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**

### For Full Stack Development (including AI)
- All frontend prerequisites above
- **AWS CLI** configured with credentials
- **AWS Account** with Lambda and API Gateway access
- **OpenAI API Key** (for AI features)
- **Firebase Account** (free tier is sufficient)
- **Firebase CLI** (for deployment): `npm install -g firebase-tools`

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd gauntlet-collabcanvas-week-1
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- Firebase SDK
- Konva and React Konva
- Tailwind CSS and PostCSS
- TypeScript and development tools

### 3. Set Up Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable the following services:
   - **Authentication**: Enable Email/Password and Google sign-in methods
   - **Firestore Database**: Create in test mode
   - **Realtime Database**: Create in test mode
4. Register a web app in your Firebase project
5. Copy the Firebase configuration values

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and fill in your Firebase and AWS configuration values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com

# AI Agent Configuration (AWS Lambda)
VITE_AI_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/ai/command
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

**Note**: To enable AI features, you must also set up the AWS Lambda backend (see AWS Lambda Setup section below).

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### 6. (Optional) Set Up AWS Lambda AI Backend

To enable AI canvas commands, you need to deploy the AWS Lambda function:

#### Step 1: Configure AWS Credentials

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, and default region (e.g., `us-east-1`).

#### Step 2: Create OpenAI API Key Secret

```bash
aws secretsmanager create-secret \
  --name collabcanvas-openai-key \
  --description "OpenAI API key for CollabCanvas AI Agent" \
  --secret-string '{"OPENAI_API_KEY":"sk-YOUR-OPENAI-KEY-HERE"}'
```

Get your OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

#### Step 3: Create IAM Role for Lambda

Create an execution role with these policies:
- `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
- `SecretsManagerReadWrite` (to read OpenAI API key)

Save the role ARN for the next step.

#### Step 4: Build and Deploy Lambda Function

```bash
cd aws-lambda

# Install dependencies
npm install

# Build TypeScript
npm run build

# Package for deployment (Windows PowerShell)
Remove-Item -Path lambda-package.zip -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path deploy -Force
Copy-Item -Path dist\* -Destination deploy\ -Recurse -Force
Copy-Item -Path node_modules -Destination deploy\node_modules -Recurse -Force
Copy-Item -Path package.json -Destination deploy\ -Force
Compress-Archive -Path deploy\* -DestinationPath lambda-package.zip -Force
Remove-Item -Path deploy -Recurse -Force

# Or use bash script (Linux/Mac)
# ./deploy.sh

# Create Lambda function (first time only)
aws lambda create-function \
  --function-name collabcanvas-ai-agent \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR-ACCOUNT-ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://lambda-package.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{SECRET_NAME=collabcanvas-openai-key,NODE_ENV=production}"

# For subsequent updates
aws lambda update-function-code \
  --function-name collabcanvas-ai-agent \
  --zip-file fileb://lambda-package.zip
```

#### Step 5: Create API Gateway

1. Go to AWS Console → API Gateway
2. Create HTTP API
3. Add integration:
   - Type: Lambda function
   - Lambda: `collabcanvas-ai-agent`
   - Integration name: `ai-command`
4. Add route:
   - Method: `POST`
   - Path: `/ai/command`
5. Configure CORS:
   - Allow origins: Your Firebase Hosting URL
   - Allow methods: `POST, OPTIONS`
   - Allow headers: `Authorization, Content-Type`
6. Deploy API and copy the Invoke URL
7. Update `.env` with `VITE_AI_API_URL=<your-api-gateway-url>`

#### Step 6: Test AI Commands

1. Restart your dev server: `npm run dev`
2. Open the app and click the AI command bar (bottom of screen)
3. Try: "Create a grid of 10 circles"
4. Check AWS CloudWatch logs for debugging:
   ```bash
   aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
   ```

For detailed AWS Lambda documentation, see [aws-lambda/README.md](./aws-lambda/README.md).

---

## 📦 Available Scripts

### Development

```bash
npm run dev
```
Starts the Vite development server with hot module replacement (HMR).

### Build

```bash
npm run build
```
Compiles TypeScript and builds the production-ready application to the `dist/` folder.

### Preview

```bash
npm run preview
```
Locally preview the production build before deploying.

### Lint

```bash
npm run lint
```
Runs ESLint to check for code quality issues.

## 🌐 Environment Variables

The application requires the following environment variables (all prefixed with `VITE_` to be accessible in the browser):

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyC...` | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `my-app.firebaseapp.com` | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `my-app-12345` | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `my-app.appspot.com` | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` | Yes |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL | `https://my-app-default-rtdb.firebaseio.com` | Yes |
| `VITE_AI_API_URL` | AWS API Gateway URL for AI agent | `https://abc123.execute-api.us-east-1.amazonaws.com/ai/command` | Optional* |

**Note**: 
- In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.
- `VITE_AI_API_URL` is optional if you don't want AI features. Without it, the app works as a regular collaborative canvas.

## 📁 Project Structure

```
gauntlet-collabcanvas-week-1/
├── aws-lambda/                   # AI Agent backend (AWS Lambda)
│   ├── src/
│   │   ├── aiAgent.ts            # LangChain AI agent logic
│   │   ├── index.ts              # Lambda handler
│   │   ├── auth/
│   │   │   └── firebaseAuth.ts   # Firebase token verification
│   │   ├── executors/
│   │   │   └── geometryExecutors.ts # Shape manipulation utilities
│   │   ├── middleware/
│   │   │   ├── idempotency.ts    # Request deduplication
│   │   │   └── rateLimit.ts      # Rate limiting
│   │   ├── schemas/
│   │   │   └── tools.ts          # Zod schemas for AI tools
│   │   └── utils/
│   │       └── secrets.ts        # AWS Secrets Manager client
│   ├── dist/                     # Compiled JavaScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── lambda-package.zip        # Deployment package
│   └── README.md                 # Lambda-specific docs
├── public/                       # Static assets
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── AuthProvider.tsx    # Auth context wrapper
│   │   │   ├── Login.tsx           # Login form
│   │   │   └── Signup.tsx          # Signup form
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx          # Main canvas component
│   │   │   ├── CanvasControls.tsx  # Zoom/pan controls
│   │   │   ├── CommandBar.tsx      # AI command input
│   │   │   ├── HistoryManager.tsx  # Undo/redo logic
│   │   │   ├── LayersPanel.tsx     # Layers panel (right sidebar)
│   │   │   ├── LayerItem.tsx       # Individual layer component
│   │   │   ├── Shape.tsx           # Individual shape renderer
│   │   │   └── Toolbox.tsx         # Tool selection sidebar
│   │   ├── Collaboration/
│   │   │   ├── Cursor.tsx          # Multiplayer cursor
│   │   │   ├── PresenceList.tsx    # Online users list
│   │   │   └── UserPresence.tsx    # User avatar badge
│   │   └── Layout/
│   │       └── Navbar.tsx          # Top navigation bar
│   ├── contexts/
│   │   ├── AIAgentContext.tsx      # AI agent state
│   │   ├── AuthContext.tsx         # Authentication state
│   │   └── CanvasContext.tsx       # Canvas & shapes state
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth hook
│   │   ├── useCanvas.ts            # Canvas data hook
│   │   ├── useCursors.ts           # Multiplayer cursors hook
│   │   ├── useKeyboard.ts          # Keyboard shortcuts hook
│   │   └── usePresence.ts          # User presence hook
│   ├── services/
│   │   ├── aiAgent.ts              # AI agent frontend service
│   │   ├── auth.ts                 # Firebase auth service
│   │   ├── canvas.ts               # Firestore canvas service
│   │   ├── cursors.ts              # RTDB cursors service
│   │   ├── export.ts               # Canvas export utilities
│   │   ├── firebase.ts             # Firebase initialization
│   │   └── presence.ts             # RTDB presence service
│   ├── utils/
│   │   ├── constants.ts            # App constants & colors
│   │   └── tools.ts                # Tool type definitions
│   ├── App.tsx                     # Main app component
│   ├── App.css                     # App styles
│   ├── main.tsx                    # App entry point
│   └── index.css                   # Global styles with Tailwind
├── .env                            # Environment variables (gitignored)
├── .env.example                    # Example environment variables
├── .firebase/                      # Firebase cache (gitignored)
├── .firebaserc                     # Firebase project aliases (gitignored)
├── .gitignore                      # Git ignore rules
├── database.rules.json             # Realtime Database security rules
├── DEPLOYMENT.md                   # Detailed deployment guide
├── firebase.json                   # Firebase configuration
├── firestore.indexes.json          # Firestore indexes
├── firestore.rules                 # Firestore security rules
├── index.html                      # HTML template
├── package.json                    # Dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── PRD.md                          # Product Requirements Document
├── README.md                       # This file
├── tailwind.config.js              # Tailwind CSS configuration
├── tasks.md                        # Development task breakdown
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json               # TypeScript app config
├── tsconfig.node.json              # TypeScript node config
└── vite.config.ts                  # Vite configuration
```

## 🧪 Using the Application

### First Time Setup

1. Run `npm run dev` to start the development server
2. Open `http://localhost:5173/` in your browser
3. You'll see the login screen with a dark theme
4. Click "Sign up" to create a new account or use "Sign in with Google"

### Canvas Controls

- **Pan**: Hold `Spacebar` + drag, or use middle mouse button
- **Zoom**: Mouse wheel, or use the zoom controls (top-right)
- **Select Tool**: Click the select icon in the toolbox (left sidebar)
- **Shape Tools**: Click rectangle, circle, triangle, star, or text icons
- **Create Shape**: With a shape tool selected, click and drag on the canvas
- **Move Shape**: Select a shape and drag it
- **Resize Shape**: Select a shape and drag the corner/edge handles
- **Rotate Shape**: Select a shape and drag the rotation handle (top)
- **Delete Shape**: Select a shape and press `Delete` or `Backspace`
- **Duplicate Shape**: Select a shape and press `Ctrl+D` (or `Cmd+D` on Mac)
- **Undo**: `Ctrl+Z` (or `Cmd+Z`)
- **Redo**: `Ctrl+Y` (or `Cmd+Y`)
- **Deselect**: Click on empty canvas area

### AI Commands ⭐

Click the command bar at the bottom of the screen and type natural language commands:

**Creating Shapes:**
- "Create a grid of 50 circles"
- "Make a login form with email, password, and button"
- "Draw 10 red squares in a row"
- "Create a blue circle at position 500, 300"

**Modifying Shapes:**
- "Move the blue rectangle to center"
- "Make the text bigger"
- "Rotate the square 45 degrees"
- "Change the circle color to red"
- "Make all rectangles 50% transparent"

**Arranging Shapes:**
- "Arrange these shapes in a horizontal row"
- "Align the squares to the left"
- "Distribute the circles evenly"

**Tips:**
- Be specific about which shapes you want to modify
- Mention colors, types, or positions to target specific shapes
- The AI understands both absolute coordinates and relative positions
- Complex layouts may require multiple commands for best results

### Layers Panel ⭐

Click the "Layers" button in the top navigation to open the layers panel:

- **Reorder Layers**: Drag and drop layers to change z-index
- **Show/Hide**: Click the eye icon to toggle visibility
- **Rename**: Double-click the layer name to edit
- **Select**: Click a layer to select it on the canvas
- **Delete**: Click the trash icon to remove a shape
- **Layer Controls**: Use ↑/↓ buttons to move layers one step at a time

### Testing Multiplayer Features

1. Open the app in multiple browser windows/tabs
2. Sign in with different accounts in each window
3. You should see:
   - Other users' cursors moving in real-time
   - Live shape updates across all windows
   - Active user count in the top-right
   - User presence list (expandable) showing all online users
   - AI commands executed by one user appear on all screens

## 🏗️ Key Architectural Decisions

### State Management
- **React Context API** for global state (auth, canvas, AI)
- Custom hooks for feature encapsulation
- Service layer pattern for Firebase and AWS operations
- Optimistic UI updates with server reconciliation

### AI Agent Architecture
- **AWS Lambda** for serverless, auto-scaling compute
- **LangChain** for agentic workflow orchestration
- **OpenAI GPT-4o-mini** for natural language understanding
- **Zod schemas** for runtime type validation
- **Firebase ID tokens** for secure authentication
- **Tool calling pattern**: AI returns structured function calls executed by frontend
- **Idempotency middleware**: Prevents duplicate command execution
- **Rate limiting**: 10 requests/user/minute to prevent abuse
- **Batch processing**: Handles up to 2000 shape operations in a single command

### Real-time Sync Strategy
- **Firestore** for persistent shape data (supports offline, complex queries)
- **Realtime Database** for ephemeral data (cursors, presence) - lower latency
- Server-authoritative updates to prevent conflicts
- Optimistic UI updates with server reconciliation
- **Challenge**: Firestore 1MB document size limit (~2300 shapes max)
  - Future: Implement sharding for unlimited shapes

### Canvas Coordinate System
- Cursors stored in **canvas coordinates** (zoom/pan independent)
- Converted to **screen coordinates** for rendering
- Enables accurate positioning across different zoom levels
- Shape transformations (rotation, scale) use Konva's built-in matrix math

### Performance Optimizations
- Cursor updates throttled to 25 FPS
- 2px movement threshold to reduce unnecessary updates
- Konva layer caching for static elements
- Automatic cleanup of disconnected users
- Lambda cold start mitigation: 512MB memory, Node.js 20.x
- AI command debouncing to prevent rapid-fire requests

## 🔒 Security

### Current Security Rules

**Firestore (`firestore.rules`)**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvas/{shapeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Realtime Database (`database.rules.json`)**
```json
{
  "rules": {
    "sessions": {
      "global-canvas-v1": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    }
  }
}
```

### Security Best Practices
- ✅ All routes require authentication
- ✅ Environment variables are gitignored
- ✅ API keys are scoped to project domain
- ✅ Firestore rules restrict to authenticated users
- ✅ RTDB rules enforce user-specific write access
- ⚠️ **Note**: Current rules allow any authenticated user full access - suitable for MVP
- 🔮 **Future**: Add per-canvas permissions, role-based access, rate limiting

## 🚀 Deployment

The application is deployed across two platforms:
- **Frontend**: Firebase Hosting
- **Backend (AI Agent)**: AWS Lambda + API Gateway

### Frontend Deployment (Firebase Hosting)

#### First Time Deployment

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (already done)
firebase init

# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

#### Update Deployment

```bash
# Build production bundle
npm run build

# Deploy hosting only
firebase deploy --only hosting

# Deploy security rules only
firebase deploy --only firestore:rules,database

# Deploy everything
firebase deploy
```

### Backend Deployment (AWS Lambda)

#### First Time Deployment

See the **AWS Lambda Setup** section above for detailed instructions.

#### Update Deployment

```bash
cd aws-lambda

# Build TypeScript
npm run build

# Package and deploy (Windows PowerShell)
Remove-Item -Path lambda-package.zip -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path deploy -Force
Copy-Item -Path dist\* -Destination deploy\ -Recurse -Force
Copy-Item -Path node_modules -Destination deploy\node_modules -Recurse -Force
Copy-Item -Path package.json -Destination deploy\ -Force
Compress-Archive -Path deploy\* -DestinationPath lambda-package.zip -Force
Remove-Item -Path deploy -Recurse -Force

# Update Lambda function
aws lambda update-function-code \
  --function-name collabcanvas-ai-agent \
  --zip-file fileb://lambda-package.zip

# Verify deployment
aws lambda get-function --function-name collabcanvas-ai-agent

# Monitor logs
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```

### Full Stack Deployment Checklist

1. ✅ Update environment variables (`.env`)
2. ✅ Build and test locally (`npm run dev`)
3. ✅ Build frontend (`npm run build`)
4. ✅ Deploy Lambda backend (`cd aws-lambda && deploy`)
5. ✅ Deploy Firebase frontend (`firebase deploy --only hosting`)
6. ✅ Test production deployment
7. ✅ Monitor CloudWatch logs for Lambda errors
8. ✅ Verify Firebase Security Rules are deployed

For detailed deployment instructions, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Firebase deployment guide
- [aws-lambda/README.md](./aws-lambda/README.md) - Lambda deployment guide

## 🚧 Development Roadmap

### ✅ MVP Completed (Week 1)

**PR #1: Project Setup**
- [x] React + Vite + TypeScript scaffolding
- [x] Core dependencies (Firebase, Konva, Tailwind CSS)
- [x] Tailwind CSS v4 configuration
- [x] Firebase project setup
- [x] Git & environment configuration

**PR #2: Firebase Authentication**
- [x] Auth context and service
- [x] Email/password authentication
- [x] Google OAuth integration
- [x] Signup/Login components
- [x] Protected routes
- [x] Navbar with user info

**PR #3: Basic Canvas Rendering**
- [x] Canvas constants & context
- [x] Konva Stage and Layer setup
- [x] Pan functionality (spacebar + drag, middle mouse)
- [x] Zoom functionality (mouse wheel, controls)
- [x] Canvas controls component
- [x] Grid background

**PR #4: Local Shape Management**
- [x] Multiple shape types (rectangle, circle, triangle, star, text)
- [x] Color palette with vibrant colors
- [x] Click-and-drag shape creation
- [x] Shape selection & dragging
- [x] Shape resizing (Transformer)
- [x] Shape rotation
- [x] Delete functionality (keyboard)
- [x] Duplicate functionality (Ctrl+D / Cmd+D)
- [x] Click-to-deselect

**PR #5: Real-time Canvas Sync**
- [x] Firestore schema design
- [x] Canvas service (CRUD operations)
- [x] Real-time shape synchronization
- [x] Object locking system
- [x] Loading states
- [x] Server-authoritative updates
- [x] Offline persistence

**PR #6: Multiplayer Cursors**
- [x] Realtime Database schema
- [x] Cursor service & hooks
- [x] Cursor component with labels
- [x] Canvas integration
- [x] Color assignment
- [x] Disconnect cleanup
- [x] Optimized updates (throttling)
- [x] Canvas-relative positioning (zoom/pan aware)

**PR #7: User Presence**
- [x] Presence schema (leveraging RTDB)
- [x] Presence service & hooks
- [x] User presence badge
- [x] Presence list component
- [x] Layout integration
- [x] Automatic online/offline detection

**PR #9: Deployment**
- [x] Firebase Hosting configuration
- [x] Production environment setup
- [x] Build & deploy process
- [x] Firestore security rules
- [x] Realtime Database security rules
- [x] Live deployment to Firebase

**UI/UX Enhancements**
- [x] Dark mode theme
- [x] Toolbox for shape selection
- [x] Select and multiple shape tools
- [x] Improved presence list visibility
- [x] Optimized layout (toolbox left, canvas center, presence right)

**AI Agent Implementation** ⭐
- [x] AWS Lambda + LangChain + OpenAI integration
- [x] Natural language command processing
- [x] 11 AI tools (create, move, resize, rotate, delete, align, distribute, etc.)
- [x] Bulk shape creation (up to 2000 shapes)
- [x] Smart color keyword mapping
- [x] Intelligent layout understanding
- [x] Firebase ID token authentication
- [x] Idempotency and rate limiting
- [x] Command bar UI component
- [x] Frontend-backend integration

**History & Layer Management** ⭐
- [x] Undo/redo functionality (Ctrl+Z / Ctrl+Y)
- [x] History tracking for all operations
- [x] Layers panel (right sidebar)
- [x] Drag-and-drop layer reordering
- [x] Show/hide shapes
- [x] Rename layers
- [x] Auto-generated layer names for AI shapes
- [x] Bring forward/backward, send to front/back
- [x] Smart icon colors for visibility

**Advanced Shape Operations** ⭐
- [x] Alignment tools (6 modes)
- [x] Distribution tools (horizontal/vertical)
- [x] Opacity and blend modes
- [x] Rich text properties (font, size, bold, italic)
- [x] Stroke properties

### 🔮 Future Enhancements

**Performance & Scalability**
- [ ] Firestore sharding to support unlimited shapes (currently ~2300 max)
- [ ] Virtual scrolling for layers panel with 1000+ shapes
- [ ] WebGL rendering for better performance
- [ ] Collaborative editing conflict resolution (operational transforms)

**UI/UX Improvements**
- [ ] Color picker for shapes
- [ ] Canvas templates library
- [ ] Multi-select with marquee selection
- [ ] Keyboard shortcuts panel
- [ ] Mobile responsive design
- [ ] Touch gesture support (pinch zoom, two-finger pan)

**AI Enhancements**
- [ ] Upgrade to GPT-4o for better quality
- [ ] Image-to-canvas conversion
- [ ] Style transfer and theme generation
- [ ] Natural language shape queries ("show me all red circles")
- [ ] Context-aware suggestions

**Collaboration Features**
- [ ] Per-canvas permissions and roles
- [ ] Collaborative chat
- [ ] Comments and annotations
- [ ] Version history and branching
- [ ] Presence avatars on canvas

**Export & Integration**
- [ ] Export to PNG, SVG, PDF
- [ ] Import from Figma, Sketch
- [ ] Component library system
- [ ] API for programmatic access
- [ ] Webhooks for canvas events

## ⚠️ Known Limitations (MVP)

- **Single Canvas**: All users share one global canvas (`global-canvas-v1`)
- **Shape Limit**: Firestore 1MB document limit restricts to ~2300 shapes maximum
- **No Persistence**: Canvas resets don't preserve view state (zoom/pan position)
- **Limited Mobile Support**: Best experience on desktop/laptop with mouse
- **No Access Control**: Any authenticated user can edit all shapes
- **Cursor Lag**: Slight delay (~40ms) due to throttling - acceptable for MVP
- **AI Command Rate Limit**: 10 requests per user per minute
- **AI Model**: GPT-4o-mini for cost efficiency (may miss complex nuances)
- **No Shape Groups**: Cannot group multiple shapes into a single unit
- **No Canvas History**: Version control and time travel not yet implemented

## 🤝 Contributing

This is an MVP project. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)

## 🐛 Troubleshooting

### Port 5173 is already in use
If you see an error that port 5173 is already in use:
```bash
# Kill the process using the port (Windows)
taskkill /F /IM node.exe

# Or change the port in vite.config.ts
```

### Firebase configuration errors
- Ensure all environment variables are properly set in `.env`
- Verify that your Firebase project has Authentication, Firestore, and Realtime Database enabled
- Check that your environment variable names are prefixed with `VITE_`
- For Realtime Database, ensure the `databaseURL` is set correctly

### AI Commands Not Working
- Verify `VITE_AI_API_URL` is set in `.env`
- Check AWS Lambda is deployed: `aws lambda get-function --function-name collabcanvas-ai-agent`
- Verify OpenAI API key is in AWS Secrets Manager
- Check CloudWatch logs: `aws logs tail /aws/lambda/collabcanvas-ai-agent --follow`
- Ensure API Gateway CORS allows your origin
- Check Firebase ID token is valid (user is authenticated)

### Firestore Size Limit Error
If you see "Document size exceeds 1,048,576 bytes":
- You've hit the ~2300 shape limit
- Clear the canvas or implement sharding (see Future Enhancements)
- Temporary workaround: Delete some shapes to free space

### Tailwind CSS v4 Issues
If you see PostCSS errors about Tailwind:
- Ensure `@tailwindcss/postcss` is installed: `npm install -D @tailwindcss/postcss`
- Update `postcss.config.js` to use `'@tailwindcss/postcss': {}`
- In `src/index.css`, use `@import "tailwindcss"` (not `@tailwind` directives)

### TypeScript Import Errors
If you see `'X' is a type and must be imported using a type-only import`:
```typescript
// Wrong
import { User } from 'firebase/auth';

// Correct
import { type User } from 'firebase/auth';
```

### Multiplayer Features Not Working After Deployment
If cursors/presence aren't showing after deployment:
- Check Realtime Database security rules allow authenticated read access
- Ensure rules allow write access to user's own node
- Verify `VITE_FIREBASE_DATABASE_URL` is set in production environment

### Cursors Not Following Canvas Position
If cursors stay in place during zoom/pan:
- Ensure `handleMouseMove` uses `getRelativePointerPosition()` (canvas coords)
- Cursor rendering should convert canvas coords to screen coords
- Check that cursor updates trigger on pan/zoom events

### Lambda Cold Start Latency
If first AI command is slow (~3-5 seconds):
- This is normal for AWS Lambda cold starts
- Consider provisioned concurrency for production
- Subsequent requests will be fast (~1-2 seconds)

### Build Errors
If you encounter build errors:
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite dist
npm run build
```

### Module resolution errors
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- Clear Vite cache: delete the `node_modules/.vite` folder
- Ensure you're using Node.js v18+

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

## 🙏 Acknowledgments

- **Firebase** for the robust backend infrastructure
- **Konva.js** for the powerful canvas rendering engine
- **Tailwind CSS** for the beautiful dark mode UI
- **Vite** for the lightning-fast development experience
- **Gauntlet AI** for the challenge and learning opportunity

## 📊 Project Stats

- **Total Development Time**: Week 1 MVP Sprint + AI Integration
- **Lines of Code**: ~5,000+ (TypeScript/TSX)
  - Frontend: ~3,500 lines
  - Backend (Lambda): ~1,500 lines
- **Components**: 20+ React components
- **Services**: 8 service modules (5 frontend, 3 backend)
- **Custom Hooks**: 5 specialized hooks
- **AI Tools**: 11 LangChain tools for canvas manipulation
- **PRs Completed**: 9 (PR #8 skipped, PR #10+ for AI features)
- **Deployment Platforms**: 2 (Firebase Hosting + AWS Lambda)
- **APIs Integrated**: 4 (Firebase Auth, Firestore, Realtime DB, OpenAI)

## 📚 Additional Resources

- [Product Requirements Document (PRD.md)](./PRD.md) - Full product specification
- [Development Tasks (tasks.md)](./tasks.md) - Task breakdown and checklist
- [AWS Lambda README (aws-lambda/README.md)](./aws-lambda/README.md) - AI backend documentation
- [Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md) - Detailed deployment steps

---

**Built with ❤️ as part of the Gauntlet AI CollabCanvas Challenge**

*Week 1 MVP - AI-Powered Real-time Collaborative Canvas Application*

**🎯 Key Achievement:** Successfully integrated OpenAI GPT-4o-mini with AWS Lambda to power natural language canvas commands, supporting up to 2000 shapes in a single command while maintaining real-time collaboration across multiple users.
