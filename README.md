# CollabCanvas MVP

> 🎨 A real-time collaborative canvas application built with React, TypeScript, Firebase, and Konva. Multiple users can create, move, and delete shapes on a shared canvas with live cursor tracking and presence awareness.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://collabcanvas-f7ee2.web.app)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-7-purple)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)](https://tailwindcss.com/)

🔗 **[Launch App](https://collabcanvas-f7ee2.web.app)** | Built for Gauntlet AI Challenge

## 🚀 Features

### ✅ Fully Implemented & Deployed

- **🎨 Interactive Canvas**
  - Infinite 5000x5000px canvas with smooth pan and zoom
  - Grid background for better spatial awareness
  - Dark mode UI for comfortable extended use
  - Tool-based workflow with dedicated toolbox

- **🔧 Shape Creation & Management**
  - Create rectangular shapes using the rectangle tool
  - Click and drag to define shape size
  - Select, move, resize, and delete shapes
  - Color-coded shapes with random vibrant colors
  - Visual feedback for selected shapes

- **👥 Real-time Collaboration**
  - Multiple users can edit the canvas simultaneously
  - Automatic object locking when shapes are being edited
  - Server-authoritative updates prevent conflicts
  - Offline persistence with automatic sync on reconnection

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

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Canvas Rendering**: Konva 10 + React Konva 19
- **Styling**: Tailwind CSS 4 with PostCSS
- **Backend**: Firebase
  - Authentication (Email/Password + Google OAuth)
  - Firestore (shape data persistence & real-time sync)
  - Realtime Database (cursor positions & presence data)
  - Security Rules (deployed for both Firestore & RTDB)
- **Hosting**: Firebase Hosting ✅ **Deployed & Live**

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**
- A **Firebase account** (free tier is sufficient)
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

Then edit `.env` and fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

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

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `my-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `my-app-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `my-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL | `https://my-app-default-rtdb.firebaseio.com` |

**Note**: In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## 📁 Project Structure

```
gauntlet-collabcanvas-week-1/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── AuthProvider.tsx    # Auth context wrapper
│   │   │   ├── Login.tsx           # Login form
│   │   │   └── Signup.tsx          # Signup form
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx          # Main canvas component
│   │   │   ├── CanvasControls.tsx  # Zoom controls
│   │   │   ├── Shape.tsx           # Individual shape renderer
│   │   │   └── Toolbox.tsx         # Tool selection sidebar
│   │   ├── Collaboration/
│   │   │   ├── Cursor.tsx          # Multiplayer cursor
│   │   │   ├── PresenceList.tsx    # Online users list
│   │   │   └── UserPresence.tsx    # User avatar badge
│   │   └── Layout/
│   │       └── Navbar.tsx          # Top navigation bar
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Authentication state
│   │   └── CanvasContext.tsx       # Canvas & shapes state
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth hook
│   │   ├── useCanvas.ts            # Canvas data hook
│   │   ├── useCursors.ts           # Multiplayer cursors hook
│   │   └── usePresence.ts          # User presence hook
│   ├── services/
│   │   ├── auth.ts                 # Firebase auth service
│   │   ├── canvas.ts               # Firestore canvas service
│   │   ├── cursors.ts              # RTDB cursors service
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
- **Rectangle Tool**: Click the rectangle icon to start drawing shapes
- **Create Shape**: With rectangle tool selected, click and drag on the canvas
- **Move Shape**: Select a shape and drag it
- **Resize Shape**: Select a shape and drag the corner/edge handles
- **Delete Shape**: Select a shape and press `Delete` or `Backspace`
- **Deselect**: Click on empty canvas area

### Testing Multiplayer Features

1. Open the app in multiple browser windows/tabs
2. Sign in with different accounts in each window
3. You should see:
   - Other users' cursors moving in real-time
   - Live shape updates across all windows
   - Active user count in the top-right
   - User presence list (expandable) showing all online users

## 🏗️ Key Architectural Decisions

### State Management
- **React Context API** for global state (auth, canvas)
- Custom hooks for feature encapsulation
- Service layer pattern for Firebase operations

### Real-time Sync Strategy
- **Firestore** for persistent shape data (supports offline, complex queries)
- **Realtime Database** for ephemeral data (cursors, presence) - lower latency
- Server-authoritative updates to prevent conflicts
- Optimistic UI updates with server reconciliation

### Canvas Coordinate System
- Cursors stored in **canvas coordinates** (zoom/pan independent)
- Converted to **screen coordinates** for rendering
- Enables accurate positioning across different zoom levels

### Performance Optimizations
- Cursor updates throttled to 25 FPS
- 2px movement threshold to reduce unnecessary updates
- Konva layer caching for static elements
- Automatic cleanup of disconnected users

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

The application is deployed on Firebase Hosting. To deploy updates:

### First Time Deployment

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

### Update Deployment

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

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

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
- [x] Shape component (rectangles)
- [x] Color palette with random colors
- [x] Click-and-drag shape creation
- [x] Shape selection & dragging
- [x] Shape resizing (Transformer)
- [x] Delete functionality (keyboard)
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
- [x] Select and rectangle tools
- [x] Improved presence list visibility
- [x] Optimized layout (toolbox left, canvas center, presence right)

### 🔮 Future Enhancements

- [ ] Additional shapes (circle, triangle, line, text)
- [ ] Color picker for shapes
- [ ] Undo/redo functionality
- [ ] Layer management
- [ ] Export canvas (PNG, SVG)
- [ ] Canvas search and filtering
- [ ] Performance optimizations for 100+ shapes
- [ ] Mobile responsive design
- [ ] Collaborative chat
- [ ] Version history

## ⚠️ Known Limitations (MVP)

- **Single Canvas**: All users share one global canvas (`global-canvas-v1`)
- **Rectangle Only**: Only rectangular shapes are supported
- **No Persistence**: Canvas resets don't preserve view state (zoom/pan)
- **Limited Mobile Support**: Best experience on desktop/laptop
- **No Access Control**: Any authenticated user can edit all shapes
- **Performance**: May slow down with 100+ shapes (not yet optimized)
- **No History**: No undo/redo or version history
- **Cursor Lag**: Slight delay (~40ms) due to throttling - acceptable for MVP
- **Static Colors**: Shape colors are random, cannot be changed after creation

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

- **Total Development Time**: Week 1 MVP Sprint
- **Lines of Code**: ~2,500+ (TypeScript/TSX)
- **Components**: 15+ React components
- **Services**: 5 Firebase services
- **Custom Hooks**: 4 specialized hooks
- **PRs Completed**: 7 (PR #8 skipped, PR #9 deployment)

## 📚 Additional Resources

- [Product Requirements Document (PRD.md)](./PRD.md) - Full product specification
- [Development Tasks (tasks.md)](./tasks.md) - Task breakdown and checklist
- [Architecture Overview (architecture.md)](./architecture.md) - System design
- [Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md) - Deployment instructions

---

**Built with ❤️ as part of the Gauntlet AI CollabCanvas Challenge**

*Week 1 MVP - Real-time Collaborative Canvas Application*
