graph TB
subgraph "Client Browser"
subgraph "React Application"
UI[UI Components]

            subgraph "Components Layer"
                Auth[Auth Components<br/>Login/Signup]
                Canvas[Canvas Components<br/>Canvas/Shapes/Controls<br/>5000x5000px bounded<br/>Multi-select + Transforms<br/>Resize/Rotate/Move<br/>Grid (1000px) centered at 2500,2500]
                Collab[Collaboration Components<br/>Cursor/Presence/Comments<br/>Comment threads + resolve<br/>Presence in top-right corner]
                Layout[Layout Components<br/>Navbar/Toolbox/Panels]
                Advanced[Advanced Components<br/>CommandBar (Ctrl+/)<br/>AlignmentTools<br/>ComponentPanel<br/>ExportDialog]
            end

            subgraph "State Management"
                AuthCtx[Auth Context<br/>User State]
                CanvasCtx[Canvas Context<br/>Shapes State + Selection<br/>Multi-select state<br/>Transform state]
                CommentsCtx[Comments Context<br/>Thread Management]
                ComponentsCtx[Components Context<br/>Master Definitions<br/>Instance Tracking]
                HistoryCtx[History Context<br/>Undo/Redo Stack<br/>Operation Journal]
            end

            subgraph "Custom Hooks"
                useAuth[useAuth<br/>Auth Operations]
                useCanvas[useCanvas<br/>Canvas Operations<br/>Transform Operations]
                useCursors[useCursors<br/>Cursor Tracking]
                usePresence[usePresence<br/>Presence Management]
                useComments[useComments<br/>Comment CRUD<br/>Thread Management]
                useComponents[useComponents<br/>Component CRUD<br/>Instance Sync]
                useHistory[useHistory<br/>Undo/Redo Logic<br/>Operation Tracking]
                useKeyboard[useKeyboard<br/>Shortcuts Manager<br/>Delete/Duplicate/Nudge]
            end

            subgraph "Services Layer"
                AuthSvc[Auth Service<br/>signup/login/Google/logout]
                CanvasSvc[Canvas Service<br/>CRUD + Locking operations<br/>Transform operations<br/>5-second timeout on inactivity<br/>Visual lock indicators<br/>Server-authoritative updates]
                CursorSvc[Cursor Service<br/>Position updates<br/>25 FPS throttle (40ms)<br/>Optimistic rendering]
                PresenceSvc[Presence Service<br/>Online status<br/>Join/leave notifications]
                CommentsSvc[Comments Service<br/>Create/Reply/Resolve<br/>Real-time sync]
                ComponentsSvc[Components Service<br/>Master CRUD<br/>Instance Management<br/>Propagation Logic]
                AISvc[AI Service<br/>Command parsing<br/>OpenAI proxy<br/>Tool execution]
                ExportSvc[Export Service<br/>PNG generation<br/>Canvas/Selection export]
                FirebaseInit[Firebase Initialization<br/>Config & Init]
            end

            subgraph "Rendering Engine"
                Konva[Konva.js<br/>Canvas Rendering<br/>Transformer for resize/rotate<br/>60 FPS @ 500+ objects]
            end

            subgraph "Utilities"
                Helpers[Helper Functions<br/>getRandomShapeColor<br/>getRandomCursorColor<br/>Geometry helpers<br/>Alignment algorithms<br/>Distribution algorithms]
                Constants[Constants<br/>Canvas dimensions (5000x5000)<br/>Initial position (2500,2500)<br/>Grid spacing (1000px)<br/>SHAPE_COLORS palette (9 colors)<br/>CURSOR_COLORS palette (9 colors)<br/>Min shape size (10x10px)<br/>Keyboard shortcuts map]
            end
        end
    end

    subgraph "Firebase Backend"
        subgraph "Firebase Authentication"
            FBAuth[Firebase Auth<br/>User Management<br/>Email/Password + Google]
        end

        subgraph "Cloud Firestore"
            FSShapes[(Canvas Document<br/>canvas/global-canvas-v2<br/>Shapes array + Locking<br/>Transform metadata<br/>Lock metadata (userId, color)<br/>Persistent Storage)]
            FSComponents[(Components Collection<br/>components/{id}<br/>Master Definitions<br/>Instance References)]
            FSComments[(Comments Subcollection<br/>canvas/{id}/comments/{commentId}<br/>Threads + Replies<br/>Resolve Status)]
        end

        subgraph "Realtime Database"
            RTDBSession[(Session Path<br/>/sessions/global-canvas-v2/userId<br/>Cursor + Presence combined<br/>High-frequency updates)]
        end

        subgraph "Firebase Hosting"
            Hosting[Static File Hosting<br/>Deployed React App]
        end

        subgraph "Firebase Functions"
            AIFunction[AI Agent Function<br/>OpenAI Proxy<br/>Tool Schema Validation<br/>Rate Limiting<br/>Idempotency]
        end
    end

    subgraph "External Services"
        OpenAI[OpenAI API<br/>Function Calling<br/>Command Parsing<br/>Multi-step Planning]
    end

    subgraph "Testing Infrastructure"
        subgraph "Test Suite"
            UnitTests[Unit Tests<br/>Vitest + Testing Library<br/>Geometry helpers<br/>Services logic]
            IntegrationTests[Integration Tests<br/>Multi-user scenarios<br/>Transform conflicts<br/>AI command execution]
            E2ETests[E2E Tests<br/>Full workflows<br/>Rubric validation]
        end

        subgraph "Firebase Emulators"
            AuthEmu[Auth Emulator]
            FirestoreEmu[Firestore Emulator]
            RTDBEmu[RTDB Emulator]
            FunctionsEmu[Functions Emulator]
        end
    end

    %% Component to Context connections
    Auth --> AuthCtx
    Canvas --> CanvasCtx
    Canvas --> HistoryCtx
    Collab --> CanvasCtx
    Collab --> CommentsCtx
    Layout --> AuthCtx
    Advanced --> CanvasCtx
    Advanced --> ComponentsCtx
    Advanced --> CommentsCtx

    %% Context to Hooks connections
    AuthCtx --> useAuth
    CanvasCtx --> useCanvas
    CanvasCtx --> useCursors
    CanvasCtx --> usePresence
    CommentsCtx --> useComments
    ComponentsCtx --> useComponents
    HistoryCtx --> useHistory
    CanvasCtx --> useKeyboard

    %% Hooks to Services connections
    useAuth --> AuthSvc
    useCanvas --> CanvasSvc
    useCursors --> CursorSvc
    usePresence --> PresenceSvc
    useComments --> CommentsSvc
    useComponents --> ComponentsSvc
    useKeyboard --> CanvasSvc
    useHistory --> CanvasSvc

    %% Services to Firebase Init
    AuthSvc --> FirebaseInit
    CanvasSvc --> FirebaseInit
    CursorSvc --> FirebaseInit
    PresenceSvc --> FirebaseInit
    CommentsSvc --> FirebaseInit
    ComponentsSvc --> FirebaseInit
    AISvc --> FirebaseInit
    ExportSvc --> FirebaseInit

    %% Firebase connections
    FirebaseInit --> FBAuth
    FirebaseInit --> FSShapes
    FirebaseInit --> FSComponents
    FirebaseInit --> FSComments
    FirebaseInit --> RTDBSession

    %% Rendering
    Canvas --> Konva

    %% Utilities
    Helpers -.-> Collab
    Helpers -.-> Advanced
    Constants -.-> Canvas
    Constants -.-> Advanced

    %% Real-time sync paths
    CanvasSvc -->|Create/Update/Delete/Transform<br/>Lock/Unlock (5s timeout)<br/>~100ms (server-authoritative)<br/>Visual indicators| FSShapes
    FSShapes -->|Real-time listener<br/>onSnapshot| CanvasSvc

    CursorSvc -->|Position updates<br/>25 FPS (40ms intervals)<br/>Smooth interpolation<br/>Optimistic rendering| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| CursorSvc

    PresenceSvc -->|Online status<br/>Join/leave events<br/>onDisconnect| RTDBSession
    RTDBSession -->|Real-time listener<br/>on value change| PresenceSvc

    CommentsSvc -->|Create/Reply/Resolve<br/>Real-time sync| FSComments
    FSComments -->|Real-time listener<br/>onSnapshot| CommentsSvc

    ComponentsSvc -->|Master CRUD<br/>Instance sync<br/>Propagation| FSComponents
    FSComponents -->|Real-time listener<br/>onSnapshot| ComponentsSvc

    AISvc -->|Command execution<br/>Tool calls<br/>Idempotency| AIFunction
    AIFunction -->|Proxy requests<br/>Schema validation| OpenAI
    OpenAI -->|Parsed commands<br/>Tool schemas| AIFunction
    AIFunction -->|Structured responses| AISvc
    AISvc -->|Execute tool calls| CanvasSvc

    ExportSvc -->|Read canvas/selection<br/>Generate PNG| Konva

    %% Auth flow
    AuthSvc -->|signup/login| FBAuth
    FBAuth -->|User token<br/>Session state| AuthSvc

    %% Deployment
    UI -.->|Build & Deploy<br/>npm run build| Hosting

    %% Testing connections
    UnitTests -.->|Test| AuthSvc
    UnitTests -.->|Test| CanvasSvc
    UnitTests -.->|Test| CommentsSvc
    UnitTests -.->|Test| ComponentsSvc
    UnitTests -.->|Test| Helpers

    IntegrationTests -.->|Test via| AuthEmu
    IntegrationTests -.->|Test via| FirestoreEmu
    IntegrationTests -.->|Test via| RTDBEmu
    IntegrationTests -.->|Test via| FunctionsEmu

    E2ETests -.->|Validate| Canvas
    E2ETests -.->|Validate| Advanced
    E2ETests -.->|Validate| Collab

    %% User interactions
    User([Users<br/>Multiple Browsers]) -->|Interact| UI
    User -->|Access deployed app| Hosting

    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef firebase fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef testing fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef rendering fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef user fill:#fce4ec,stroke:#c2185b,stroke-width:3px
    classDef external fill:#fff9c4,stroke:#f57f17,stroke-width:2px

    class Auth,Canvas,Collab,Layout,Advanced,AuthCtx,CanvasCtx,CommentsCtx,ComponentsCtx,HistoryCtx,useAuth,useCanvas,useCursors,usePresence,useComments,useComponents,useHistory,useKeyboard,AuthSvc,CanvasSvc,CursorSvc,PresenceSvc,CommentsSvc,ComponentsSvc,AISvc,ExportSvc,FirebaseInit,Helpers,Constants client
    class FBAuth,FSShapes,FSComponents,FSComments,RTDBSession,Hosting,AIFunction firebase
    class UnitTests,IntegrationTests,E2ETests,AuthEmu,FirestoreEmu,RTDBEmu,FunctionsEmu testing
    class Konva rendering
    class User user
    class OpenAI external

---

## Key Architecture Decisions

### Data Flow (Updated for Production)
- **Server-Authoritative State**: All shape operations (create/update/delete/transform) wait for Firestore confirmation (~100ms latency accepted for reliability)
- **Optimistic Rendering Exception**: Cursor movements are optimistically rendered locally for smooth UX (only exception to server-authoritative rule)
- **Operation Journal**: Client-local history tracks user-initiated operations for undo/redo with server version tagging
- **Idempotency**: All mutations include `requestId` to dedupe retries on both client and server

### Performance Optimizations
- **Cursor Throttling**: 25 FPS (40ms intervals) with smooth interpolation to prevent jitter
- **Canvas Rendering**: Konva.js for 60 FPS performance with Transformer for resize/rotate
  - Target: 500+ shapes with 5+ concurrent users without degradation
  - Graceful degradation beyond 500 shapes
- **Database Strategy**: 
  - **Firestore**: Persistent canvas state, components, comments
  - **Realtime Database**: High-frequency updates (cursors, presence)
  - **Cloud Functions**: AI agent proxy with OpenAI
- **Batching & Memoization**: Optimize renders; throttle, batch, memoize where possible

### Locking Mechanism
- **First-Come Lock**: First user to drag/transform acquires exclusive lock
- **5-Second Timeout**: Lock auto-releases after 5 seconds of inactivity (resets during active operations)
- **Transform Locking**: Selection locked during resize/rotate operations
- **Visual Indicators**: 
  - Colored border matching locking user's cursor color
  - User name badge near locked shape
  - Tooltip "Locked by [username]" on move attempt
- **Multi-user Safety**: Two users cannot transform the same selection

### Conflict Resolution Strategy
- **Server-authoritative** Firestore updates for all canvas state changes
- **First-writer lock** for movement and transform operations
- **Last-write-wins** for non-locked property updates (documented semantics)
- **Reconnection handling**: Offline cache, queued operations, reconciliation on reconnect

### Advanced Features Architecture

#### Multi-Select & Transforms
- **Marquee selection**: Drag-to-select multiple shapes
- **Shift-click**: Add/remove from selection
- **Konva Transformer**: Per-selection handles for resize/rotate
- **Bounds enforcement**: Cannot drag/resize outside canvas (5000x5000)

#### Undo/Redo System
- **Client-local history** of user-initiated operations
- **Operation types**: create, move, resize, rotate, delete, duplicate
- **Scope limitation**: Only undo/redo user's own operations (avoid cross-user conflicts)
- **Persistence**: History boundaries across reconnects
- **Keyboard shortcuts**: Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z (redo)

#### Components System
- **Master definitions**: Firestore `components/{id}` collection stores master node graphs
- **Instance references**: Shapes with `type: "componentInstance"` and `componentId`
- **Propagation**: Master updates automatically propagate to all instances (<100ms)
- **Override support**: Instances can override position, rotation, scale, opacity
- **Component panel**: Gallery view with drag-to-instantiate functionality

#### Comments & Annotations
- **Firestore subcollection**: `canvases/{id}/comments/{commentId}`
- **Shape anchoring**: Comments pinned to specific shapes with relative offset
- **Thread support**: Replies array within comment document
- **Status tracking**: `open` or `resolved` state
- **Real-time sync**: Comment visibility updates immediately for all users
- **UI rendering**: Comment pins above canvas layer with click-to-focus

#### AI Canvas Agent
- **Interface**: In-app command bar (Ctrl+/) with command history
- **Model**: OpenAI with function calling via Firebase Cloud Functions
- **Security**: API key stored as Firebase Functions secret, never exposed to client
- **Tool breadth**: 10+ command types:
  1. `createShape` - Create rectangles, circles, text
  2. `moveShape` - Move objects by ID
  3. `resizeShape` - Resize objects
  4. `rotateShape` - Rotate objects by degrees
  5. `align` - Align selected objects (left/right/center/top/middle/bottom)
  6. `distribute` - Distribute objects evenly (horizontal/vertical)
  7. `createText` - Create text shapes
  8. `makeComponent` - Create component from selection
  9. `instantiateComponent` - Place component instance
  10. `export` - Export canvas/selection as PNG
- **Latency targets**: <2s for simple commands; multi-step plans stream progress
- **Shared state**: All AI actions write through server-authoritative pipeline
- **Idempotency**: Request IDs prevent duplicate operations on retry
- **Complex commands**: Multi-step plans (e.g., "create a login form") with intermediate feedback

#### Keyboard Shortcuts System
- **Central manager**: `useKeyboard` hook with focus/blur handling
- **Shortcuts implemented**:
  - Delete/Backspace: Delete selected shapes
  - Ctrl/Cmd+D: Duplicate selection
  - Arrow keys: Nudge 1px (Shift for 10px)
  - Ctrl/Cmd+Z: Undo
  - Ctrl/Cmd+Shift+Z: Redo
  - Ctrl/Cmd+/: Open command bar
  - Escape: Deselect
- **Browser conflict prevention**: Prevent default behaviors where needed

#### Alignment & Distribution Tools
- **Alignment modes**: Left, Right, Center, Top, Middle, Bottom
- **Distribution**: Horizontal/Vertical with optional spacing parameter
- **Tolerance**: Within 1px accuracy
- **Bounding box computation**: Calculates selection bounds including rotation
- **UI**: Toolbar buttons with keyboard bindings
- **Works with**: Mixed shape types (rectangles, text, component instances)

#### Export System
- **PNG export**: Using Konva `toDataURL()` method
- **Export modes**: 
  - Full canvas export
  - Selection export (via temporary layer composition)
- **Export dialog**: Area choice (canvas/selection) + pixel ratio options
- **Performance**: Non-blocking; large canvases don't freeze UI
- **Quality**: Configurable pixel ratio for high-DPI exports

### UI/UX Decisions
- **Canvas**: 5000x5000px bounded space, centered at (2500, 2500) with 1000px grid
- **Shape Creation**: Click-and-drag interaction (draw mode by default), minimum 10x10px size
- **Shape Types**: Rectangles (MVP), expanding to circles, text, component instances
- **Random Colors**: Shapes assigned random colors from 9-color palette on creation
- **Presence**: Fixed top-right corner position, expandable list, toast notifications for join/leave
- **Pan Controls**: Space bar + drag or middle mouse button
- **Command Bar**: Ctrl+/ to open; natural language input; history navigation
- **Connection Status**: Visual indicator for online/offline/reconnecting states

### Tech Stack (Production)
- **Frontend**: React + Vite, Konva.js for rendering, Tailwind CSS for styling
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Cloud Functions)
- **AI Integration**: OpenAI API via Firebase Functions proxy
- **Deployment**: Firebase Hosting with production security rules
- **Testing**: Vitest, React Testing Library, Firebase Emulators
- **CI/CD**: GitHub Actions for lint, typecheck, tests

### Security & Privacy
- **OpenAI API key**: Stored as Firebase Functions secret; never exposed to client
- **Authentication**: All Firestore/RTDB operations require authenticated user
- **Security rules**: 
  - Validate shape schema on writes
  - Enforce ownership for locking operations
  - Comment/component guards
- **Rate limiting**: AI endpoint limited per user
- **Audit logging**: Structured logs for AI commands with prompt/result redaction
- **Secret management**: Environment variables for all sensitive keys

### Persistence & Reliability
- **Offline support**: Firestore offline cache with queued operations
- **Reconnection**: Automatic reconciliation after network drop (tested up to 30s)
- **Connection status UI**: Clear indicator of online/offline/reconnecting state
- **Operation retry**: Exponential backoff with deduplication via `requestId`
- **State recovery**: Mid-drag refresh preserves final state

### Canvas Evolution
- **MVP (v1)**: Single global canvas (`global-canvas-v1`)
- **Production (v2)**: Enhanced global canvas (`global-canvas-v2`) with all advanced features
- **Future**: Multi-project support with separate canvases per project (Phase 3)

### Testing Strategy
- **Unit tests**: Helpers, services, geometry algorithms, alignment logic
- **Integration tests**: 
  - Multi-user scenarios (simultaneous edits, locking, conflicts)
  - Canvas sync and transform operations
  - AI command execution (mocked OpenAI)
  - Comment threads and component propagation
- **E2E tests**: Full workflows validating rubric requirements
- **Manual testing matrix**: Chrome/Firefox/Safari on desktop resolutions
- **Performance testing**: 500+ objects with 5+ concurrent users
- **Rubric validation**: Explicit test scenarios for each rubric section
