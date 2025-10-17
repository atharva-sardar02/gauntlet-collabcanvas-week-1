# CollabCanvas - Product Requirements Document

**Project**: CollabCanvas - Real-Time Collaborative Design Tool  
**Owner**: Atharva Sardar  
**Last Updated**: October 15, 2025  
**Repository**: Firebase Hosting (Auth/Firestore/RTDB)

---

## Document Structure

This PRD contains two phases:
1. **[Phase 1: MVP](#phase-1-mvp)** - Foundational multiplayer canvas (✅ Completed)
2. **[Phase 2: Production](#phase-2-production-features)** - Advanced features + AI agent (🟡 In Progress)

---
---

# Phase 1: MVP

**Status**: ✅ Completed  
**Goal**: Build a solid multiplayer foundation with basic canvas functionality  
**Note**: AI features are intentionally not part of MVP and are addressed in Phase 2

---

## Canvas Architecture (MVP)

**Single Global Canvas Approach:**

- MVP features ONE shared global canvas that all authenticated users access
- No project creation or management in MVP
- No canvas selection or dashboard
- All users collaborate on the same shared canvas space
- Future: Will add multi-project support with separate canvases per project

**URL Structure:**

- Simple route (e.g., `/canvas` or just `/`)
- No dynamic canvas IDs needed for MVP

---

## User Stories

### Primary User: Designer/Creator (MVP Priority)

- As a designer, I want to **create an account and log in** so that my work is associated with my identity
- As a designer, I want to **see a large canvas workspace** so that I have room to design
- As a designer, I want to **pan and zoom the canvas smoothly** so that I can navigate my design space
- As a designer, I want to **create basic shapes (rectangles)** so that I can build simple designs
- As a designer, I want to **move objects around the canvas** so that I can arrange my design
- As a designer, I want to **delete objects I've created** so that I can remove mistakes or unwanted elements
- As a designer, I want to **see other users' cursors with their names** so that I know who's working where
- As a designer, I want to **see changes made by other users in real-time** so that we can collaborate seamlessly
- As a designer, I want to **see who else is currently online** so that I know who I'm collaborating with
- As a designer, I want my **work to persist when I leave** so that I don't lose progress

**Note:** Focus on completing all Designer/Creator user stories before addressing Collaborator needs.

### Secondary User: Collaborator (Implement After Primary User)

- As a collaborator, I want to **join an existing canvas session** so that I can work with my team
- As a collaborator, I want to **see all existing objects when I join** so that I have full context
- As a collaborator, I want to **make changes without conflicts** so that multiple people can work simultaneously

---

## Key Features for MVP

### 1. Authentication System

**Must Have:**

- User registration via email/password (Firebase Auth)
- Google social login (Firebase Auth)
- User login/logout
- Persistent user sessions
- User display names visible to collaborators

**Display Name Logic:**

- Use Google display name if signing in via Google
- Use email prefix (before @) if signing in via email/password
- Display truncated version if name is too long (max 20 chars)

**Success Criteria:**

- Users can create accounts and maintain sessions across page refreshes
- Each user has a unique identifier and display name

### 2. Canvas Workspace

**Must Have:**

- Large canvas area (5000x5000px virtual space)
- Smooth pan functionality (click-and-drag with space bar or middle mouse button)
- Zoom functionality (mousewheel or pinch)
- Light gray background with subtle grid (1000px spacing) for spatial reference
- Hard boundaries at canvas edges
- 60 FPS performance during all interactions

**Canvas Boundaries:**

- Objects cannot be placed or moved outside boundaries (5000x5000px)
- Drag operations stop at boundary edges
- Canvas starts centered at (2500, 2500) for new users
- Visual edge indicators: subtle gray border at canvas edges

**Performance Targets:**

- Can handle at least 500 rectangles without performance degradation
- No hard limit on shape count (performance testing target, not enforced limit)
- Graceful performance degradation if exceeding 500 shapes

**Success Criteria:**

- Canvas feels responsive and smooth
- No lag during pan/zoom operations
- Maintains 60 FPS with 500+ shapes on canvas
- Objects are constrained within canvas boundaries

### 3. Shape Creation & Manipulation

**Must Have:**

- **Rectangles only for MVP** (circles and text out of scope)
- Ability to create new rectangles via click-and-drag interaction (draw rectangle by dragging)
- Ability to select shapes (click)
- Ability to move shapes (drag)
- Visual feedback for selected objects (highlighted border)
- Random fill color assigned on creation (from predefined palette)

**Rectangle Creation Mode:**

- Default mode is "draw" mode - users can immediately click and drag to create rectangles
- Click-and-drag creates rectangle from starting point to ending point
- Minimum size: 10x10px to avoid accidental tiny shapes
- Maximum size: constrained by canvas boundaries

**Selection Behavior:**

- Clicking a different shape automatically deselects the previous shape
- Only one shape can be selected at a time (multi-select out of scope)
- Clicking empty canvas deselects current selection

**Shape Styling:**

- Random fill color assigned from predefined palette on creation
- Color palette ensures good contrast and visibility
- Colors are purely aesthetic (no functional meaning)

**Success Criteria:**

- Shape creation is intuitive and immediate
- Drag operations are smooth and responsive
- Selected state is clearly visible (highlighted border)
- Selection behavior is predictable and consistent

### 4. Real-Time Synchronization

**Must Have:**

- Broadcast shape creation to all users (<100ms)
- Broadcast shape movements to all users (<100ms)
- Broadcast shape deletions to all users (<100ms)
- Handle concurrent edits without breaking
- Object locking: First user to select/drag an object locks it for editing
- Locked objects cannot be moved by other users simultaneously
- Visual indicator showing which user has locked an object
- Auto-release lock when user stops dragging

**Conflict Resolution Strategy:**

- First user to start moving an object acquires the lock
- Other users cannot move the locked object until lock is released
- Lock automatically releases after drag completes or timeout (5 seconds of inactivity)
- Lock timeout resets if user continues dragging (active drag)

**Visual Lock Indicators:**

- Locked shapes show a colored border matching the user's cursor color who has the lock
- Small badge with user's name appears near the locked shape
- Attempting to move a locked shape shows a "Locked by [username]" tooltip
- Selected state (highlighted border) is distinct from locked state (colored border)

**Success Criteria:**

- Object changes visible to all users within 100ms
- No "ghost objects" or desync issues
- No simultaneous edits to the same object
- Clear visual feedback when an object is locked by another user
- Lock automatically releases after drag completes

### 5. Multiplayer Cursors

**Must Have:**

- Show cursor position for each connected user
- Display user name near cursor
- Update cursor positions in real-time (<50ms)
- Unique color per user

**Cursor Colors:**

- Randomly assigned from predefined color palette on user join
- Color palette: `["#FF5733", "#33C1FF", "#FFC300", "#DAF7A6", "#C70039", "#900C3F", "#581845", "#28B463", "#3498DB"]`
- Ensure sufficient contrast against white/light backgrounds
- Maintain color consistency per user throughout session

**Cursor Update Performance:**

- Throttle cursor position updates to 25 FPS (40ms intervals)
- Smooth interpolation between updates to prevent jitter
- Updates sent via Firebase Realtime Database for minimal latency

**Success Criteria:**

- Cursors move smoothly without jitter
- Names are readable and don't obscure content
- Cursor updates don't impact canvas performance
- Each user has a distinct, visible cursor color

### 6. Shape Deletion

**Must Have:**

- Delete selected shape with Delete/Backspace key
- Broadcast deletion to all users in real-time
- Deleted shapes removed from database immediately
- Cannot delete shapes locked by other users

**Success Criteria:**

- Deletion is instant and syncs across all clients within 100ms
- No "ghost shapes" after deletion
- Deleted shapes permanently removed from persistent storage

### 7. Presence Awareness

**Must Have:**

- List of currently connected users displayed in top-right corner
- Compact user pills/avatars showing name and cursor color
- Real-time join/leave notifications (subtle toast message)
- Visual indicator of online status (green dot)
- Shows count of active users (e.g., "3 users online")

**UI Location:**

- Fixed position in top-right corner of viewport
- Collapses to just a count on smaller screens
- Clicking expands to show full list of users

**Success Criteria:**

- Users can see who's in the session at all times
- Join/leave events update immediately
- List doesn't obstruct canvas work area

### 8. State Persistence

**Must Have:**

- Save canvas state to database
- Load canvas state on page load
- Persist through disconnects and reconnects
- Multiple users can rejoin and see same state

**Success Criteria:**

- All users leave and return → work is still there
- Page refresh doesn't lose data
- New users joining see complete current state

### 9. Deployment

**Must Have:**

- Publicly accessible URL
- Stable hosting for 5+ concurrent users
- No setup required for users

**Success Criteria:**

- Anyone can access via URL
- Supports at least 5 simultaneous users
- No crashes under normal load

---

## Data Model

### Firestore Collection: `canvas` (single document for MVP)

**Document ID:** `global-canvas-v1`

```json
{
  "canvasId": "global-canvas-v1",
  "shapes": [
    {
      "id": "shape_uuid_1",
      "type": "rectangle",
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 100,
      "fill": "#7B68EE",
      "createdBy": "user_id",
      "createdAt": "timestamp",
      "lastModifiedBy": "user_id",
      "lastModifiedAt": "timestamp",
      "isLocked": false,
      "lockedBy": null
    }
  ],
  "lastUpdated": "timestamp"
}
```

**Color Palette for Shapes:**
- Random color assigned from predefined set: `["#7B68EE", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#FFB6C1", "#DDA15E", "#BC6C25"]`
- Ensures variety and visual distinction between shapes

### Firebase Realtime Database: `presence` (for cursors)

```json
{
  "sessions": {
    "global-canvas-v1": {
      "user_id_1": {
        "displayName": "John Doe",
        "cursorColor": "#FF5733",
        "cursorX": 450,
        "cursorY": 300,
        "lastSeen": "timestamp"
      },
      "user_id_2": {
        "displayName": "Jane Smith",
        "cursorColor": "#33C1FF",
        "cursorX": 620,
        "cursorY": 180,
        "lastSeen": "timestamp"
      }
    }
  }
}
```

**Why Two Databases?**

- Firestore: For persistent canvas state (shapes, metadata)
- Realtime Database: For high-frequency updates (cursor positions, presence)
- Realtime Database has lower latency for cursor movements

---

## Proposed Tech Stack

### Option 1: Firebase (Recommended for Speed)

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Firebase Authentication
- Firestore for state persistence
- Firebase Realtime Database for cursor positions

**Pros:**

- Fastest setup (authentication is plug-and-play)
- Built-in real-time capabilities
- Generous free tier
- Automatic scaling
- Simple deployment with Firebase Hosting

**Cons:**

- Vendor lock-in to Google
- Firestore queries can be expensive at scale
- Less control over backend logic

**Pitfalls to Watch:**

- Firestore charges per read/write - optimize updates
- Need to structure data carefully (avoid deep nesting)
- Realtime Database better for cursor positions (lower latency)

---

### Option 2: Supabase + WebSockets

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Supabase Auth
- Supabase PostgreSQL for state persistence
- Supabase Realtime for updates

**Pros:**

- Open source alternative to Firebase
- PostgreSQL is more flexible than Firestore
- Built-in real-time subscriptions
- Better for complex queries later

**Cons:**

- Slightly more setup than Firebase
- Realtime can be tricky with high-frequency updates
- Free tier has connection limits

**Pitfalls to Watch:**

- Realtime subscriptions count against connection limits
- Need to handle reconnection logic carefully
- Cursor updates might need separate WebSocket channel

---

### Option 3: Custom Backend (Express + Socket.io)

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Node.js + Express
- Socket.io for real-time communication
- MongoDB or PostgreSQL for persistence
- Custom authentication or Auth0

**Pros:**

- Complete control over architecture
- Socket.io is purpose-built for real-time
- Can optimize exactly for your use case
- No vendor lock-in

**Cons:**

- Most time-consuming to build
- Need to build authentication from scratch
- More deployment complexity
- Need to manage scaling yourself

**Pitfalls to Watch:**

- Authentication takes significant time
- Need to handle WebSocket reconnection
- Scaling WebSockets requires sticky sessions
- More potential for bugs in custom code

---

## Recommended Stack for MVP

**Frontend:** React + Vite + Konva.js + Tailwind  
**Backend:** Firebase (Authentication + Firestore + Realtime Database)  
**Deployment:** Firebase Hosting

**Rationale:** Firebase provides a fully integrated solution - authentication, real-time database, and hosting all in one ecosystem. This minimizes configuration complexity and ensures optimal performance between services. Firebase Hosting offers automatic SSL, global CDN, and seamless integration with Firebase Auth and databases.

---

## Out of Scope for MVP

### Features NOT Included:

- Multiple shape types (circles, text, lines, polygons, etc.)
- Color customization for shapes
- Resize functionality
- Rotate functionality
- Multi-select
- Undo/redo
- Layer management
- Export functionality
- Shape styling (borders, shadows, gradients, etc.)
- Copy/paste
- Keyboard shortcuts beyond delete
- Mobile support
- Multiple projects or canvases
- Canvas dashboard or project list
- User profile management
- Canvas sharing/invite system

### Technical Items NOT Included:

- Operational transforms (OT) or CRDTs for conflict resolution
- Infinite canvas (using fixed 5000x5000px space)
- Canvas minimap
- Performance monitoring/analytics
- User permissions/roles
- Canvas history/versioning
- Optimistic updates (out of scope for MVP - all updates wait for server confirmation)
- Advanced locking mechanisms beyond basic first-come lock

**Technical Priorities:**

- Focus on server-authoritative state to ensure consistency
- Accept slight latency (~100ms) for operations in exchange for reliability
- Cursor movements use optimistic rendering for smooth UX (only exception)

---

## Known Limitations & Trade-offs

1. **Single Global Canvas**: All users share one global canvas (multi-project support in Phase 2)
2. **Basic Shapes**: Rectangles only (other shapes in future releases)
3. **Simple Locking**: First-come lock mechanism (not CRDT or OT)
4. **Limited Styling**: Random fill colors only, no borders/shadows/gradients or style customization
5. **No History**: No undo/redo or version control
6. **Desktop Only**: Not optimized for mobile/tablet
7. **Fixed Canvas Size**: 5000x5000px limit (not infinite canvas)
8. **No Permissions**: All users have equal edit access

---

## Success Metrics for MVP Checkpoint

1. **Two users can edit simultaneously** in different browsers
2. **Page refresh mid-edit** preserves all state
3. **Multiple shapes created rapidly** sync without visible lag
4. **Locking works correctly** - only one user can move an object at a time
5. **60 FPS maintained** during all interactions
6. **Deployed and accessible** via public URL

---

## MVP Testing Checklist

### Core Functionality:

- [ ] User can register with email/password
- [ ] User can sign in with Google
- [ ] User can log out and log back in
- [ ] Display name appears correctly for all users

### Canvas Operations:

- [ ] Can create rectangles on canvas
- [ ] Can select rectangles by clicking
- [ ] Can move rectangles by dragging
- [ ] Can delete rectangles with Delete/Backspace key
- [ ] Pan and zoom work smoothly
- [ ] Objects stay within canvas boundaries

### Real-Time Collaboration:

- [ ] Two users in different browsers can both create rectangles
- [ ] User A creates shape → User B sees it within 100ms
- [ ] User A moves shape → User B sees movement in real-time
- [ ] User A locks shape by dragging → User B cannot move it
- [ ] User A deletes shape → disappears for User B immediately
- [ ] Lock releases automatically after drag completes

### Multiplayer Features:

- [ ] Can see other user's cursor position
- [ ] Can see other user's name near their cursor
- [ ] Each user has a unique cursor color
- [ ] Cursor movements are smooth (no jitter)
- [ ] Join/leave presence updates immediately
- [ ] User list shows all currently connected users

### Persistence:

- [ ] Both users leave and return → all shapes persist
- [ ] Page refresh doesn't lose any data
- [ ] New user joining sees complete current state
- [ ] Deleted shapes don't reappear after refresh

### Performance:

- [ ] 60 FPS maintained with 100+ shapes on canvas
- [ ] No lag during rapid shape creation
- [ ] Cursor updates don't cause frame drops
- [ ] Pan/zoom remains smooth with many objects

---

## Risk Mitigation

**Biggest Risk:** Real-time sync breaking under load  
**Mitigation:** Test with multiple browsers early and often; use Firebase Realtime Database for high-frequency updates

**Second Risk:** Performance degradation with many objects  
**Mitigation:** Use canvas-based rendering (Konva), not DOM elements; limit to 500 shapes for MVP

**Third Risk:** Locking mechanism causing deadlocks  
**Mitigation:** Implement automatic lock timeout (5 seconds of inactivity); clear visual feedback for lock state with user name badge

**Fourth Risk:** Cursor updates causing performance issues  
**Mitigation:** Use Firebase Realtime Database (not Firestore) for cursor positions; throttle updates to 25 FPS (40ms intervals) with smooth interpolation

---
---

# Phase 2: Production Features

**Status**: 🟡 In Progress  
**Owner**: Atharva Sardar  
**Last Updated**: October 15, 2025

---

## 1) Purpose & Scope

Evolve the MVP into a production-ready real‑time collaborative canvas with an **AI Canvas Agent** (text-based command bar backed by OpenAI) and a focused set of Figma‑inspired features that map directly to the final rubric. We keep the **Firebase** backend (Auth, Firestore, Realtime DB, Hosting) and add secure serverless integration for the AI agent.

### In‑Scope (production)
- **Collaboration**: sub‑100ms shape sync, sub‑50ms cursor sync; locking + documented conflict policy
- **Canvas features**: rectangles (existing) plus transforms; multi-select; **Tier 1 + Tier 2 + Tier 3** features chosen below
- **AI Canvas Agent** (text command bar): external **OpenAI API** with function calling; shared, deterministic state updates
- **Persistence & reconnection**: resilient offline, reconnect, and state recovery
- **Deployment & security**: production Firebase rules, secrets handling for OpenAI keys

### Out‑of‑Scope (for this phase)
- New backend (Socket.io/custom) migration
- Mobile-specific layout and gestures
- Plugin marketplace / extensibility API beyond internal "tools"

---

## 2) User Types & Core User Stories

### Roles
- **Designer/Creator** (primary) — creates and edits designs
- **Collaborator/Reviewer** — co-edits and leaves comments/annotations
- **Observer** — read‑only participant for demos

### High‑priority User Stories
1. As a designer, I can **undo/redo** edits with keyboard shortcuts so I can safely explore ideas.  
2. As a designer, I can **export the canvas or selected objects as PNG** for sharing.  
3. As a designer, I can use **keyboard shortcuts**: Delete, **Duplicate**, and Arrow keys to nudge objects.  
4. As a designer, I can **align** selected objects (left, right, center, top, middle, bottom) and **distribute** them evenly.  
5. As a designer, I can define **components** (reusable symbols) and **instantiate** them across the canvas.  
6. As a collaborator, I can leave **comments/annotations** pinned to objects and reply/resolve threads.  
7. As any user, I see **other cursors**, presence, and edits in real‑time with clear lock indicators.  
8. As any user, I can issue **natural‑language commands** (e.g., “Create a 200×300 rectangle centered, then align selected left”) and see consistent shared results.  

(Stories retain all MVP behaviors: auth, pan/zoom, shape create/move, locking, presence, persistence.)

---

## 3) Requirements Traceability to Rubric

**Section 1: Collaborative Infrastructure**
- **Real‑time sync targets**: <100ms objects, <50ms cursors; jitter‑free under rapid edits.
- **Conflict resolution**: server‑authoritative Firestore updates; **first‑writer lock** for movement; **last‑write‑wins** for non‑locked property updates; documented semantics.
- **Persistence & reconnection**: offline cache, queued ops, reconnect reconciliation, connection status UI.

**Section 2: Canvas & Performance**
- **Transforms**: move/resize/rotate; **multi‑select** (shift‑click / marquee).  
- **Performance**: 60 FPS with 500+ objects and 5+ users; graceful degradation beyond.

**Section 3: Advanced Features (choices)**
- **Tier 1 (choose 3):** Undo/Redo; Export PNG (canvas/selection); Keyboard shortcuts (Delete, Duplicate, Arrow nudge).  
- **Tier 2 (choose 2):** Alignment tools; Components system (create, edit master, instance sync).  
- **Tier 3 (choose 1):** Collaborative comments/annotations with resolve state.

**Section 4: AI Canvas Agent**
- **Interface**: in‑app **command bar** with history.  
- **Model**: **OpenAI (function calling)**; serverless callable endpoint mediates tool execution.  
- **Breadth**: at least **8 command types** spanning creation, manipulation, layout, and one complex.  
- **Latency**: <2s simple; multi‑step plans stream progress (UI toasts).  
- **Shared state**: all AI actions write through the same server‑authoritative pipeline.

**Section 5–6: Technical & Docs**
- Modular React + contexts/hooks/services; typed APIs; exhaustive error handling and retry.  
- README: setup, env vars, architecture, security notes; demo link.  
- Deployment: Firebase Hosting + Rules; 5+ concurrent users validated.

---

## 4) Architecture Overview

### Frontend
- **React + Konva + Tailwind**  
- Contexts/hooks for Auth, Canvas, Presence, Cursors, Comments, AI Agent
- Command Bar (Ctrl+/) → parse → send to AI endpoint → receive structured tool calls → execute

### Backend & Data
- **Auth**: Firebase Auth (Email/Password, Google).  
- **Canvas**: Firestore `canvases/{canvasId}` with `shapes[]`, metadata, and version.  
- **Presence/Cursors**: RTDB `/sessions/{canvasId}/{userId}`.  
- **Comments**: Firestore subcollection `canvases/{canvasId}/comments/{commentId}` with target `shapeId`, thread items, status.  
- **Components**: Firestore `components/{componentId}` and instance references on shapes.  
- **AI endpoint**: Firebase Cloud Functions (Callable HTTPS) proxies to OpenAI; enforces auth, rate limits, schema validation, and idempotency tokens.

### AI Tool Schema (examples)
- `createShape({ type, x, y, width, height, fill })`
- `moveShape({ id, x, y })`, `resizeShape({ id, width, height })`, `rotateShape({ id, degrees })`
- `align({ ids, mode })`, `distribute({ ids, axis, spacing? })`
- `createText({ text, x, y, fontSize })`
- `makeComponent({ selectionIds, name })`, `instantiateComponent({ componentId, x, y })`
- `export({ scope: "selection"|"canvas", format: "png" })`

**Authority & Conflicts**
- All tool calls **persist via Firestore**; clients subscribe and render.  
- **Locks** for drag/transform; **last‑write‑wins** on unlocked scalar props.  
- **Idempotency**: `requestId` to dedupe retries (client and function).

---

## 5) Data Models (high‑level)

### `canvases/{canvasId}` (Firestore)
```json
{
  "canvasId": "global-canvas-v2",
  "shapes": [
    {
      "id": "uuid",
      "type": "rect|circle|text|componentInstance",
      "x": 0, "y": 0, "width": 0, "height": 0,
      "rotation": 0,
      "fill": "#4ECDC4",
      "text": null,
      "componentId": null,
      "lockedBy": null, "lockedAt": null,
      "createdBy": "uid", "createdAt": 0,
      "updatedBy": "uid", "updatedAt": 0
    }
  ],
  "version": 2,
  "lastUpdated": 0
}
```

### `components/{componentId}` (Firestore)
```json
{
  "id": "componentId",
  "name": "Button/Primary",
  "definition": { "shapes": [/* master nodes */] },
  "createdBy": "uid",
  "createdAt": 0,
  "updatedAt": 0
}
```

### `canvases/{canvasId}/comments/{commentId}` (Firestore)
```json
{
  "id": "commentId",
  "shapeId": "uuid",
  "authorId": "uid",
  "text": "Align this with the header",
  "status": "open|resolved",
  "createdAt": 0,
  "updatedAt": 0,
  "replies": [ { "authorId": "uid", "text": "...", "createdAt": 0 } ]
}
```

### RTDB `/sessions/{canvasId}/{userId}`
```json
{ "displayName": "Atharva", "cursorColor": "#33C1FF", "cursorX": 0, "cursorY": 0, "lastSeen": 0 }
```

---

## 6) Security, Privacy, and Secrets

- OpenAI API key **never** in client; stored as Firebase Functions secret / env var.  
- Auth checks on all writes; Firestore/RTDB rules validate shape schema and ownership.  
- Rate‑limit AI endpoint per user; verify prompt → tool schema translation server‑side.  
- Idempotent mutations; structured logging and redaction for prompts/results.

---

## 7) Performance & Reliability Targets

- **60 FPS** interactions at 500+ objects, **5+ users**.  
- **<100ms** shape sync, **<50ms** cursor sync; throttled cursor updates (25 FPS) with interpolation.  
- Offline support; queued ops with retry; connection status indicator.

---

## 8) Testing & Validation

- Unit tests for helpers/services; integration tests for auth flow, canvas sync, locking, comments, AI command execution.  
- Test scenarios: simultaneous drag, delete‑vs‑edit, create collisions, reconnect, network drop, export correctness.  
- Manual matrix: Chrome/Firefox/Safari, desktop resolutions.

---

## 9) Risks & Mitigations

- **CRDT/OT complexity** → keep server‑authoritative + locks now; evaluate CRDT later.  
- **AI mis‑parsing** → strict tool schemas + confirm steps UI for complex commands.  
- **Cost/latency** → cache small results, batch tool calls, stream progress, fallbacks.

---

## 10) Milestones

**Reference**: See [tasks.md](./tasks.md) for detailed PR breakdown

- **PR #10-12**: Infrastructure & transforms hardening  
- **PR #13**: Export PNG (Tier-1)
- **PR #14**: Alignment tools (Tier-2)
- **PR #15-17**: Components system (Tier-2)
- **PR #18**: Comments/annotations (Tier-3)
- **PR #11-12**: Keyboard shortcuts + Undo/Redo (Tier-1)
- **PR #19-21**: AI agent (backend, UI, complex commands)
- **PR #22-27**: Performance, security, testing, docs, demo prep

---

## 11) Acceptance Criteria

- Rubric Section 1–2 targets met in production deploy.  
- **Tier 1: 3 features**, **Tier 2: 2 features**, **Tier 3: 1 feature** fully implemented and tested.  
- **AI agent**: ≥8 commands across categories; complex layout command demonstrated.  
- Demo video shows 2+ users, AI commands, and architecture overview.