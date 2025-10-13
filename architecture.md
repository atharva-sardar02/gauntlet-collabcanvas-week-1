graph TB
subgraph "Client Browser"
subgraph "React Application"
UI[UI Components]

            subgraph "Components Layer"
                Auth[Auth Components<br/>Login/Signup]
                Canvas[Canvas Components<br/>Canvas/Rectangle/Controls<br/>5000x5000px bounded<br/>Click-and-drag creation<br/>Random colors from palette<br/>Grid (1000px) centered at 2500,2500]
                Collab[Collaboration Components<br/>Cursor/Presence<br/>Presence in top-right corner]
                Layout[Layout Components<br/>Navbar]
            end

            subgraph "State Management"
                AuthCtx[Auth Context<br/>User State]
                CanvasCtx[Canvas Context<br/>Shapes State]
            end

            subgraph "Custom Hooks"
                useAuth[useAuth<br/>Auth Operations]
                useCanvas[useCanvas<br/>Canvas Operations]
                useCursors[useCursors<br/>Cursor Tracking]
                usePresence[usePresence<br/>Presence Management]
            end

            subgraph "Services Layer"
                AuthSvc[Auth Service<br/>signup/login/Google/logout]
                CanvasSvc[Canvas Service<br/>CRUD + Locking operations<br/>5-second timeout on inactivity<br/>Visual lock indicators<br/>Server-authoritative updates]
                CursorSvc[Cursor Service<br/>Position updates<br/>25 FPS throttle (40ms)<br/>Optimistic rendering]
                PresenceSvc[Presence Service<br/>Online status<br/>Join/leave notifications]
                FirebaseInit[Firebase Initialization<br/>Config & Init]
            end

            subgraph "Rendering Engine"
                Konva[Konva.js<br/>Canvas Rendering<br/>60 FPS]
            end

            subgraph "Utilities"
                Helpers[Helper Functions<br/>getRandomShapeColor<br/>getRandomCursorColor]
                Constants[Constants<br/>Canvas dimensions (5000x5000)<br/>Initial position (2500,2500)<br/>Grid spacing (1000px)<br/>SHAPE_COLORS palette (9 colors)<br/>CURSOR_COLORS palette (9 colors)<br/>Min shape size (10x10px)]
            end
        end
    end

    subgraph "Firebase Backend"
        subgraph "Firebase Authentication"
            FBAuth[Firebase Auth<br/>User Management<br/>Email/Password + Google]
        end

        subgraph "Cloud Firestore"
            FSShapes[(Canvas Document<br/>canvas/global-canvas-v1<br/>Shapes array + Locking<br/>Random fill colors<br/>Lock metadata (userId, color)<br/>Persistent Storage)]
        end

        subgraph "Realtime Database"
            RTDBSession[(Session Path<br/>/sessions/global-canvas-v1/userId<br/>Cursor + Presence combined<br/>High-frequency updates)]
        end

        subgraph "Firebase Hosting"
            Hosting[Static File Hosting<br/>Deployed React App]
        end
    end

    subgraph "Testing Infrastructure"
        subgraph "Test Suite"
            UnitTests[Unit Tests<br/>Vitest + Testing Library]
            IntegrationTests[Integration Tests<br/>Multi-user scenarios]
        end

        subgraph "Firebase Emulators"
            AuthEmu[Auth Emulator]
            FirestoreEmu[Firestore Emulator]
            RTDBEmu[RTDB Emulator]
        end
    end

    %% Component to Context connections
    Auth --> AuthCtx
    Canvas --> CanvasCtx
    Collab --> CanvasCtx
    Layout --> AuthCtx

    %% Context to Hooks connections
    AuthCtx --> useAuth
    CanvasCtx --> useCanvas
    CanvasCtx --> useCursors
    CanvasCtx --> usePresence

    %% Hooks to Services connections
    useAuth --> AuthSvc
    useCanvas --> CanvasSvc
    useCursors --> CursorSvc
    usePresence --> PresenceSvc

    %% Services to Firebase Init
    AuthSvc --> FirebaseInit
    CanvasSvc --> FirebaseInit
    CursorSvc --> FirebaseInit
    PresenceSvc --> FirebaseInit

    %% Firebase connections
    FirebaseInit --> FBAuth
    FirebaseInit --> FSShapes
    FirebaseInit --> RTDBSession

    %% Rendering
    Canvas --> Konva

    %% Utilities
    Helpers -.-> Collab
    Constants -.-> Canvas

    %% Real-time sync paths
    CanvasSvc -->|Create/Update/Delete<br/>Lock/Unlock (5s timeout)<br/>~100ms (server-authoritative)<br/>Visual indicators| FSShapes
    FSShapes -->|Real-time listener<br/>onSnapshot| CanvasSvc

    CursorSvc -->|Position updates<br/>25 FPS (40ms intervals)<br/>Smooth interpolation<br/>Optimistic rendering| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| CursorSvc

    PresenceSvc -->|Online status<br/>Join/leave events<br/>onDisconnect| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| PresenceSvc

    %% Auth flow
    AuthSvc -->|signup/login| FBAuth
    FBAuth -->|User token<br/>Session state| AuthSvc

    %% Deployment
    UI -.->|Build & Deploy<br/>npm run build| Hosting

    %% Testing connections
    UnitTests -.->|Test| AuthSvc
    UnitTests -.->|Test| CanvasSvc
    UnitTests -.->|Test| Helpers

    IntegrationTests -.->|Test via| AuthEmu
    IntegrationTests -.->|Test via| FirestoreEmu
    IntegrationTests -.->|Test via| RTDBEmu

    %% User interactions
    User([Users<br/>Multiple Browsers]) -->|Interact| UI
    User -->|Access deployed app| Hosting

    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef firebase fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef testing fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef rendering fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef user fill:#fce4ec,stroke:#c2185b,stroke-width:3px

    class Auth,Canvas,Collab,Layout,AuthCtx,CanvasCtx,useAuth,useCanvas,useCursors,usePresence,AuthSvc,CanvasSvc,CursorSvc,PresenceSvc,FirebaseInit,Helpers,Constants client
    class FBAuth,FSShapes,RTDBSession,Hosting firebase
    class UnitTests,IntegrationTests,AuthEmu,FirestoreEmu,RTDBEmu testing
    class Konva rendering
    class User user

---

## Key Architecture Decisions

### Data Flow
- **Server-Authoritative State**: All shape operations (create/update/delete) wait for Firestore confirmation (~100ms latency accepted for reliability)
- **Optimistic Rendering Exception**: Cursor movements are optimistically rendered locally for smooth UX (only exception to server-authoritative rule)

### Performance Optimizations
- **Cursor Throttling**: 25 FPS (40ms intervals) with smooth interpolation to prevent jitter
- **Canvas Rendering**: Konva.js for 60 FPS performance, targeting 500+ shapes without degradation
- **Database Strategy**: 
  - Firestore for persistent canvas state
  - Realtime Database for high-frequency updates (cursors, presence)

### Locking Mechanism
- **First-Come Lock**: First user to drag acquires exclusive lock
- **5-Second Timeout**: Lock auto-releases after 5 seconds of inactivity (resets during active dragging)
- **Visual Indicators**: 
  - Colored border matching locking user's cursor color
  - User name badge near locked shape
  - Tooltip "Locked by [username]" on move attempt

### UI/UX Decisions
- **Canvas**: 5000x5000px bounded space, centered at (2500, 2500) with 1000px grid
- **Shape Creation**: Click-and-drag interaction (draw mode by default), minimum 10x10px size
- **Random Colors**: Shapes assigned random colors from 9-color palette on creation
- **Presence**: Fixed top-right corner position, expandable list, toast notifications for join/leave
- **Pan Controls**: Space bar + drag or middle mouse button

### Tech Stack
- **Frontend**: React + Vite, Konva.js for rendering, Tailwind CSS for styling
- **Backend**: Firebase (Auth, Firestore, Realtime Database)
- **Deployment**: Firebase Hosting
- **Testing**: Vitest, React Testing Library, Firebase Emulators

### Single Global Canvas (MVP)
- All users collaborate on one shared canvas (document ID: `global-canvas-v1`)
- No multi-project support in MVP (planned for Phase 2)
- Simple routing structure (no dynamic canvas IDs)
