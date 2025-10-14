# CollabCanvas MVP - Development Task List

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx
│   │   │   ├── CanvasControls.jsx
│   │   │   └── Shape.jsx
│   │   ├── Collaboration/
│   │   │   ├── Cursor.jsx
│   │   │   ├── UserPresence.jsx
│   │   │   └── PresenceList.jsx
│   │   └── Layout/
│   │       ├── Navbar.jsx
│   │       └── Sidebar.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   ├── canvas.js
│   │   └── presence.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCanvas.js
│   │   ├── useCursors.js
│   │   └── usePresence.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── CanvasContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   ├── setup.js
│   ├── unit/
│   │   ├── utils/
│   │   │   └── helpers.test.js
│   │   ├── services/
│   │   │   ├── auth.test.js
│   │   │   └── canvas.test.js
│   │   └── contexts/
│   │       └── CanvasContext.test.js
│   └── integration/
│       ├── auth-flow.test.js
│       ├── canvas-sync.test.js
│       └── multiplayer.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── firebase.json
├── .firebaserc
└── README.md
```

---

## PR #1: Project Setup & Firebase Configuration

**Branch:** `setup/initial-config`  
**Goal:** Initialize project with all dependencies and Firebase configuration

### Tasks:

- [x] **1.1: Initialize React + Vite Project**

  - Files to create: `package.json`, `vite.config.ts`, `index.html`
  - Run: `npm create vite@latest collabcanvas -- --template react-ts`
  - Verify dev server runs

- [x] **1.2: Install Core Dependencies**

  - Files to update: `package.json`
  - Install:
    ```bash
    npm install firebase konva react-konva
    ```

- [x] **1.3: Configure Tailwind CSS**

  - Files to create: `tailwind.config.js`, `postcss.config.js`
  - Files to update: `src/index.css`
  - Run: `npx tailwindcss init -p`
  - Add Tailwind directives to `index.css`

- [x] **1.4: Set Up Firebase Project**

  - Create Firebase project in console
  - Enable Authentication (Email/Password AND Google)
  - Create Firestore database
  - Create Realtime Database
  - Files to create: `.env`, `.env.example`
  - Add Firebase config keys to `.env`

- [x] **1.5: Create Firebase Service File**

  - Files to create: `src/services/firebase.ts`
  - Initialize Firebase app
  - Export `auth`, `db` (Firestore), `rtdb` (Realtime Database)

- [x] **1.6: Configure Git & .gitignore**

  - Files to create/update: `.gitignore`
  - Ensure `.env` is ignored
  - Add `node_modules/`, `dist/`, `.firebase/` to `.gitignore`

- [x] **1.7: Create README with Setup Instructions**
  - Files to create: `README.md`
  - Include setup steps, env variables needed, run commands

**PR Checklist:**

- [x] Dev server runs successfully
- [x] Firebase initialized without errors
- [x] Tailwind classes work in test component
- [x] `.env` is in `.gitignore`

---

## PR #2: Authentication System

**Branch:** `feature/authentication`  
**Goal:** Complete user authentication with login/signup flows

### Tasks:

- [x] **2.1: Create Auth Context**

  - Files to create: `src/contexts/AuthContext.tsx`
  - Provide: `currentUser`, `loading`, `login()`, `signup()`, `logout()`

- [x] **2.2: Create Auth Service**

  - Files to create: `src/services/auth.ts`
  - Functions: `signUp(email, password, displayName)`, `signIn(email, password)`, `signInWithGoogle()`, `signOut()`, `updateUserProfile(displayName)`
  - Display name logic: Extract from Google profile or use email prefix

- [x] **2.3: Create Auth Hook**

  - Files to create: `src/hooks/useAuth.ts`
  - Return auth context values

- [x] **2.4: Build Signup Component**

  - Files to create: `src/components/Auth/Signup.tsx`
  - Form fields: email, password, display name
  - Handle signup errors
  - Redirect to canvas on success

- [x] **2.5: Build Login Component**

  - Files to create: `src/components/Auth/Login.tsx`
  - Form fields: email, password
  - Add "Sign in with Google" button
  - Handle login errors
  - Link to signup page

- [x] **2.6: Create Auth Provider Wrapper**

  - Files to create: `src/components/Auth/AuthProvider.tsx`
  - Wrap entire app with AuthContext
  - Show loading state during auth check

- [x] **2.7: Update App.tsx with Protected Routes**

  - Files to update: `src/App.tsx`
  - Show Login/Signup if not authenticated
  - Show Canvas if authenticated
  - Basic routing logic

- [x] **2.8: Create Navbar Component**
  - Files to create: `src/components/Layout/Navbar.tsx`
  - Display current user name
  - Logout button

**PR Checklist:**

- [ ] Can create new account with email/password
- [ ] Can login with existing account
- [ ] Can sign in with Google
- [ ] Display name appears correctly (Google name or email prefix)
- [ ] Display name truncates at 20 chars if too long
- [ ] Logout works and redirects to login
- [ ] Auth state persists on page refresh

---

## PR #3: Basic Canvas Rendering

**Branch:** `feature/canvas-basic`  
**Goal:** Canvas with pan, zoom, and basic stage setup

### Tasks:

- [x] **3.1: Create Canvas Constants**

  - Files to create: `src/utils/constants.ts`
  - Define: `CANVAS_WIDTH = 5000`, `CANVAS_HEIGHT = 5000`, `VIEWPORT_WIDTH`, `VIEWPORT_HEIGHT`
  - Define: `CANVAS_CENTER_X = 2500`, `CANVAS_CENTER_Y = 2500` (initial view position)
  - Define: `GRID_SPACING = 1000` (for visual grid)

- [x] **3.2: Create Canvas Context**

  - Files to create: `src/contexts/CanvasContext.tsx`
  - State: `shapes`, `selectedId`, `stageRef`
  - Provide methods to add/update/delete shapes

- [x] **3.3: Build Base Canvas Component**

  - Files to create: `src/components/Canvas/Canvas.tsx`
  - Set up Konva Stage and Layer
  - Container div with fixed dimensions
  - Light gray background with subtle grid (1000px spacing)
  - Canvas starts centered at (2500, 2500) for new users
  - Subtle gray border at canvas edges (visual boundary indicator)

- [x] **3.4: Implement Pan Functionality**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Enable panning via space bar + drag or middle mouse button
  - Handle `onDragMove` on Stage
  - Constrain panning to canvas bounds (5000x5000px)
  - Prevent objects from being placed/moved outside boundaries

- [x] **3.5: Implement Zoom Functionality**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle `onWheel` event
  - Zoom to cursor position
  - Min zoom: 0.1, Max zoom: 3

- [x] **3.6: Create Canvas Controls Component**

  - Files to create: `src/components/Canvas/CanvasControls.tsx`
  - Buttons: "Zoom In", "Zoom Out", "Reset View"
  - Position: Fixed/floating on canvas
  - Note: "Add Shape" button removed - shapes created via click-and-drag interaction

- [x] **3.7: Add Canvas to App**
  - Files to update: `src/App.tsx`
  - Wrap Canvas in CanvasContext
  - Include Navbar and Canvas

**PR Checklist:**

- [ ] Canvas renders at correct size (5000x5000px)
- [ ] Canvas starts centered at (2500, 2500)
- [ ] Visual grid with 1000px spacing visible
- [ ] Subtle gray border at canvas edges visible
- [ ] Can pan via space bar + drag or middle mouse button
- [ ] Can zoom with mousewheel
- [ ] Zoom centers on cursor position
- [ ] Reset view button works
- [ ] Canvas boundaries are enforced with visual indicators
- [ ] 60 FPS maintained during pan/zoom

---

## PR #4: Shape Creation & Manipulation

**Branch:** `feature/shapes`  
**Goal:** Create, select, and move shapes on canvas

### Tasks:

- [x] **4.1: Create Shape Component**

  - Files to create: `src/components/Canvas/Shape.tsx`
  - Support: **Rectangles only for MVP**
  - Props: `id`, `x`, `y`, `width`, `height`, `fill`, `isSelected`, `isLocked`, `lockedBy`
  - Visual feedback: Highlighted border when selected, colored border with user badge when locked

- [x] **4.2: Define Shape Color Palette**

  - Files to update: `src/utils/constants.ts`
  - Define: `SHAPE_COLORS = ["#7B68EE", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#FFB6C1", "#DDA15E", "#BC6C25"]`
  - Function: `getRandomShapeColor()` to pick random color from palette

- [x] **4.3: Add Shape Creation Logic (Click-and-Drag)**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `addShape(type, startPos, endPos)` - creates rectangle from drag start to drag end
  - Generate unique ID for each shape
  - Default properties: random fill color from SHAPE_COLORS palette
  - Minimum size: 10x10px (prevent accidental tiny shapes)
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Implement click-and-drag rectangle creation (draw mode by default)
  - Show preview rectangle while dragging
  - Finalize shape on mouse release

- [x] **4.4: Implement Shape Rendering**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Map over `shapes` array
  - Render Shape component for each

- [x] **4.5: Add Shape Selection**

  - Files to update: `src/components/Canvas/Shape.tsx`
  - Handle `onClick` to set selected
  - Visual feedback: highlighted border when selected
  - Files to update: `src/contexts/CanvasContext.tsx`
  - State: `selectedId`

- [x] **4.6: Implement Shape Dragging**

  - Files to update: `src/components/Canvas/Shape.tsx`
  - Enable `draggable={true}` (separate from draw mode)
  - Handle `onDragEnd` to update position
  - Constrain dragging within canvas boundaries
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `updateShape(id, updates)`

- [x] **4.7: Add Click-to-Deselect**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Handle Stage `onClick` to deselect when clicking empty canvas

- [x] **4.8: Add Delete Functionality**
  - Files to update: `src/contexts/CanvasContext.tsx`
  - Function: `deleteShape(id)`
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add keyboard listener for Delete/Backspace key
  - Delete selected shape when key pressed
  - Cannot delete shapes locked by other users

**PR Checklist:**

- [ ] Can create rectangles via click-and-drag interaction
- [ ] Preview rectangle shows while dragging
- [ ] Rectangles have random colors from predefined palette
- [ ] Minimum rectangle size enforced (10x10px)
- [ ] Rectangles render at correct positions with random fill colors
- [ ] Can select rectangles by clicking (highlighted border shows)
- [ ] Can drag rectangles smoothly (separate from drawing)
- [ ] Selection state shows visually with highlighted border
- [ ] Can delete selected rectangle with Delete/Backspace key
- [ ] Clicking another shape deselects the previous one
- [ ] Clicking empty canvas deselects current selection
- [ ] Objects cannot be moved outside canvas boundaries
- [ ] No lag with 20+ shapes

---

## PR #5: Real-Time Shape Synchronization

**Branch:** `feature/realtime-sync`  
**Goal:** Sync shape changes across all connected users

### Tasks:

- [x] **5.1: Design Firestore Schema**

  - Collection: `canvas` (single document: `global-canvas-v1`)
  - Document structure:
    ```
    {
      canvasId: "global-canvas-v1",
      shapes: [
        {
          id: string,
          type: 'rectangle',
          x: number,
          y: number,
          width: number,
          height: number,
          fill: string (random color from SHAPE_COLORS palette),
          createdBy: string (userId),
          createdAt: timestamp,
          lastModifiedBy: string,
          lastModifiedAt: timestamp,
          isLocked: boolean,
          lockedBy: string (userId) or null,
          lockedByColor: string (cursor color of locking user) or null
        }
      ],
      lastUpdated: timestamp
    }
    ```

- [x] **5.2: Create Canvas Service**

  - Files to create: `src/services/canvas.ts`
  - Function: `subscribeToShapes(canvasId, callback)`
  - Function: `createShape(canvasId, shapeData)`
  - Function: `updateShape(canvasId, shapeId, updates)`
  - Function: `deleteShape(canvasId, shapeId)`

- [x] **5.3: Create Canvas Hook**

  - Files to create: `src/hooks/useCanvas.ts`
  - Subscribe to Firestore on mount
  - Sync local state with Firestore
  - Return: `shapes`, `addShape()`, `updateShape()`, `deleteShape()`

- [x] **5.4: Integrate Real-Time Updates in Context**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Replace local state with `useCanvas` hook
  - Listen to Firestore changes
  - Update local shapes array on remote changes

- [x] **5.5: Implement Object Locking**

  - Files to update: `src/services/canvas.ts`
  - Strategy: First user to select/drag acquires lock
  - Function: `lockShape(canvasId, shapeId, userId, userColor)`
  - Function: `unlockShape(canvasId, shapeId)`
  - Auto-release lock after drag completes or timeout (5 seconds of inactivity)
  - Lock timeout resets if user continues dragging (active drag)
  - Visual indicators:
    - Locked shapes show colored border matching user's cursor color
    - Small badge with user's name appears near locked shape
    - Tooltip "Locked by [username]" when attempting to move locked shape
  - Other users cannot move locked objects
  - Files to update: `src/components/Canvas/Shape.tsx`
  - Render lock visual indicators (colored border + user badge)

- [x] **5.6: Add Loading States**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - Show loading spinner while initial shapes load
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Display "Loading canvas..." message

- [x] **5.7: Implement Server-Authoritative Updates**

  - Files to update: `src/contexts/CanvasContext.tsx`
  - All shape operations wait for server confirmation (no optimistic updates)
  - Accept ~100ms latency for operations in exchange for reliability
  - Show loading/pending state during operations

- [x] **5.8: Handle Offline/Reconnection**
  - Files to update: `src/hooks/useCanvas.ts`
  - Enable Firestore offline persistence
  - Show reconnection status

**PR Checklist:**

- [ ] Open two browsers: creating shape in one appears in other
- [ ] User A starts dragging shape → shape locks for User A
- [ ] User B cannot move shape while User A has it locked
- [ ] Lock shows visual indicators:
  - Colored border matching User A's cursor color
  - Small badge with User A's name near shape
  - Tooltip "Locked by [username]" on hover attempt
- [ ] Lock releases automatically when User A stops dragging
- [ ] Lock releases after timeout (5 seconds of inactivity)
- [ ] Lock timeout resets during active dragging
- [ ] Moving shape in one browser updates in other (~100ms, server-authoritative)
- [ ] Deleting shape in one removes from other
- [ ] Cannot delete shapes locked by other users
- [ ] Page refresh loads all existing shapes
- [ ] All users leave and return: shapes still there
- [ ] No duplicate shapes or sync issues
- [ ] All operations wait for server confirmation (no optimistic updates except cursors)

---

## PR #6: Multiplayer Cursors

**Branch:** `feature/cursors`  
**Goal:** Real-time cursor tracking for all connected users

### Tasks:

- [x] **6.1: Design Realtime Database Schema**

  - Path: `/sessions/global-canvas-v1/{userId}`
  - Data structure:
    ```
    {
      displayName: string,
      cursorColor: string,
      cursorX: number,
      cursorY: number,
      lastSeen: timestamp
    }
    ```

- [x] **6.2: Create Cursor Service**

  - Files to create: `src/services/cursors.ts`
  - Function: `updateCursorPosition(canvasId, userId, x, y, name, color)`
  - Function: `subscribeToCursors(canvasId, callback)`
  - Function: `removeCursor(canvasId, userId)` (on disconnect)

- [x] **6.3: Create Cursors Hook**

  - Files to create: `src/hooks/useCursors.ts`
  - Track mouse position on canvas
  - Convert screen coords to canvas coords
  - Throttle updates to 25 FPS (40ms intervals)
  - Smooth interpolation between updates to prevent jitter
  - Optimistic rendering (only exception to server-authoritative rule)
  - Return: `cursors` object (keyed by userId)

- [x] **6.4: Build Cursor Component**

  - Files to create: `src/components/Collaboration/Cursor.tsx`
  - SVG cursor icon with user color
  - Name label next to cursor
  - Smooth CSS transitions for movement

- [x] **6.5: Integrate Cursors into Canvas**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Add `onMouseMove` handler to Stage
  - Update cursor position in RTDB
  - Render Cursor components for all other users

- [x] **6.6: Assign User Colors**

  - Files to update: `src/utils/constants.ts`
  - Define: `CURSOR_COLORS = ["#FF5733", "#33C1FF", "#FFC300", "#DAF7A6", "#C70039", "#900C3F", "#581845", "#28B463", "#3498DB"]`
  - Files to create/update: `src/utils/helpers.js`
  - Function: `getRandomCursorColor()` - randomly assigned on join
  - Ensure sufficient contrast against light backgrounds
  - Maintain color consistency per user throughout session

- [x] **6.7: Handle Cursor Cleanup**

  - Files to update: `src/hooks/useCursors.ts`
  - Remove cursor on component unmount
  - Use `onDisconnect()` in RTDB to auto-cleanup

- [x] **6.8: Optimize Cursor Updates**
  - Files to update: `src/hooks/useCursors.ts`
  - Throttle mouse events to 25 FPS (40ms intervals)
  - Only send if position changed significantly (>2px)
  - Smooth interpolation for received cursor positions

**PR Checklist:**

- [ ] Moving mouse shows cursor to other users
- [ ] Cursor has correct user name and color
- [ ] Cursors move smoothly without jitter
- [ ] Cursor disappears when user leaves
- [ ] Updates happen within 50ms
- [ ] No performance impact with 5 concurrent cursors

---

## PR #7: User Presence System

**Branch:** `feature/presence`  
**Goal:** Show who's online and active on the canvas

### Tasks:

- [x] **7.1: Design Presence Schema**

  - Path: `/sessions/global-canvas-v1/{userId}` (same as cursors)
  - Data structure (combined with cursor data):
    ```
    {
      displayName: string,
      cursorColor: string,
      cursorX: number,
      cursorY: number,
      lastSeen: timestamp
    }
    ```
  - Note: Presence and cursor data share same RTDB location

- [x] **7.2: Create Presence Service**

  - Files to create: `src/services/presence.ts`
  - Function: `setUserOnline(canvasId, userId, name, color)`
  - Function: `setUserOffline(canvasId, userId)`
  - Function: `subscribeToPresence(canvasId, callback)`
  - Use `onDisconnect()` to auto-set offline

- [x] **7.3: Create Presence Hook**

  - Files to create: `src/hooks/usePresence.ts`
  - Set user online on mount
  - Subscribe to presence changes
  - Return: `onlineUsers` array

- [x] **7.4: Build Presence List Component**

  - Files to create: `src/components/Collaboration/PresenceList.tsx`
  - Display list of online users
  - Compact user pills/avatars showing name and cursor color
  - Show count: "3 users online"
  - Position: Fixed in top-right corner of viewport
  - Collapses to just count on smaller screens
  - Expandable to show full list of users

- [x] **7.5: Build User Presence Badge**

  - Files to create: `src/components/Collaboration/UserPresence.tsx`
  - Avatar/initial with user color
  - Tooltip with full name

- [x] **7.6: Add Presence to Layout**

  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Include PresenceList component
  - Position in top-right corner (fixed position)
  - Ensure it doesn't obstruct canvas work area
  - Show subtle toast notifications for join/leave events

- [x] **7.7: Integrate Presence System**
  - Files to update: `src/components/Canvas/Canvas.tsx`
  - Initialize presence when canvas loads
  - Clean up on unmount

**PR Checklist:**

- [ ] Current user appears in presence list
- [ ] Other users appear when they join (with subtle toast notification)
- [ ] Users disappear when they leave (with subtle toast notification)
- [ ] User count is accurate (e.g., "3 users online")
- [ ] Colors match cursor colors
- [ ] Updates happen in real-time
- [ ] Presence list positioned in top-right corner
- [ ] List doesn't obstruct canvas work area
- [ ] Can expand/collapse list on smaller screens

---

## PR #8: Testing, Polish & Bug Fixes

**Branch:** `fix/testing-polish`  
**Goal:** Ensure MVP requirements are met and fix critical bugs

### Tasks:

- [ ] **8.1: Multi-User Testing**

  - Test with 2-5 concurrent users
  - Create shapes simultaneously
  - Move shapes simultaneously
  - Check for race conditions

- [ ] **8.2: Performance Testing**

  - Create 500+ shapes and test FPS
  - Test pan/zoom with many objects
  - Monitor Firestore read/write counts
  - Optimize if needed

- [ ] **8.3: Persistence Testing**

  - All users leave canvas
  - Return and verify shapes remain
  - Test page refresh mid-edit
  - Test browser close and reopen

- [ ] **8.4: Error Handling**

  - Files to update: All service files
  - Add try/catch blocks
  - Display user-friendly error messages
  - Handle network failures gracefully

- [ ] **8.5: UI Polish**

  - Files to update: All component files
  - Consistent spacing and colors
  - Responsive button states
  - Loading states for all async operations

- [ ] **8.6: Verify Keyboard Shortcuts**

  - Files to verify: `src/components/Canvas/Canvas.jsx`
  - Delete/Backspace key: delete selected shape (already implemented in PR #4)
  - Escape key: deselect (optional enhancement)
  - Note: Undo/redo is out of scope for MVP

- [ ] **8.7: Cross-Browser Testing**

  - Test in Chrome, Firefox, Safari
  - Fix any compatibility issues

- [ ] **8.8: Document Known Issues**
  - Files to update: `README.md`
  - List any known bugs or limitations
  - Add troubleshooting section

**PR Checklist:**

- [ ] All MVP requirements pass
- [ ] No console errors
- [ ] Smooth performance on test devices
- [ ] Works in multiple browsers
- [ ] Error messages are helpful

---

## PR #9: Deployment to Firebase Hosting & Final Prep

**Branch:** `deploy/production`  
**Goal:** Deploy to Firebase Hosting and finalize documentation

### Tasks:

- [x] **9.1: Configure Firebase Hosting**

  - Files to create: `firebase.json`, `.firebaserc`
  - Run: `firebase init hosting`
  - Set public directory to `dist`

- [x] **9.2: Update Environment Variables**

  - Create production Firebase project (or use same)
  - Files to update: `.env.example`
  - Document all required env vars

- [x] **9.3: Build Production Bundle**

  - Run: `npm run build`
  - Test production build locally
  - Check bundle size

- [x] **9.4: Deploy to Firebase Hosting**

  - Run: `firebase deploy --only hosting`
  - Test deployed URL
  - Verify all features work in production

- [x] **9.5: Set Up Firestore Security Rules**

  - Files to create: `firestore.rules`
  - Allow authenticated users to read/write
  - Validate shape schema
  - Deploy rules: `firebase deploy --only firestore:rules`

- [x] **9.6: Set Up Realtime Database Rules**

  - Files to create: `database.rules.json`
  - Allow authenticated users read/write
  - Deploy rules: `firebase deploy --only database`

- [ ] **9.7: Update README with Deployment Info**

  - Files to update: `README.md`
  - Add live demo link
  - Add deployment instructions
  - Add architecture diagram (optional)

- [ ] **9.8: Final Production Testing**

  - Test with 5 concurrent users on deployed URL
  - Verify auth works
  - Verify shapes sync
  - Verify cursors work
  - Verify presence works

- [ ] **9.9: Create Demo Video Script**
  - Outline key features to demonstrate
  - Prepare 2-3 browser windows for demo

**PR Checklist:**

- [ ] App deployed and accessible via public URL
- [ ] Auth works in production
- [ ] Real-time features work in production
- [ ] 5+ concurrent users tested successfully
- [ ] README has deployment link and instructions
- [ ] Security rules deployed and working

---

## MVP Completion Checklist

### Required Features:

- [ ] Basic canvas with pan/zoom (5000x5000px with boundaries)
  - [ ] Canvas starts centered at (2500, 2500)
  - [ ] Visual grid with 1000px spacing
  - [ ] Subtle gray border at canvas edges
  - [ ] Pan via space bar or middle mouse button
- [ ] Rectangle shapes with random fill colors from predefined palette
  - [ ] Click-and-drag to create rectangles (draw mode by default)
  - [ ] Minimum size 10x10px enforced
  - [ ] Preview rectangle while dragging
- [ ] Ability to create, move, and delete objects
  - [ ] Highlighted border for selected shapes
  - [ ] Delete with Delete/Backspace key
- [ ] Object locking (first user to drag locks the object)
  - [ ] Colored border matching user's cursor color
  - [ ] User name badge near locked shape
  - [ ] 5-second timeout on inactivity
  - [ ] Tooltip "Locked by [username]" on attempt to move
- [ ] Real-time sync between 2+ users (~100ms, server-authoritative)
  - [ ] All operations wait for server confirmation
  - [ ] No optimistic updates (except cursors)
- [ ] Multiplayer cursors with name labels and unique colors
  - [ ] 25 FPS throttle (40ms intervals)
  - [ ] Smooth interpolation between updates
- [ ] Presence awareness (who's online)
  - [ ] Fixed position in top-right corner
  - [ ] Shows user count and expandable list
  - [ ] Subtle toast notifications for join/leave
- [ ] User authentication (email/password AND Google login)
- [ ] Deployed to Firebase Hosting and publicly accessible

### Performance Targets:

- [ ] 60 FPS during all interactions
- [ ] Shape changes sync in <100ms
- [ ] Cursor positions sync in <50ms
- [ ] Support 500+ simple objects without FPS drops
- [ ] Support 5+ concurrent users without degradation

### Testing Scenarios:

- [ ] 2 users editing simultaneously in different browsers
- [ ] User A drags shape → User B sees it locked with colored border and name badge
- [ ] User B cannot move locked shape → sees "Locked by User A" tooltip
- [ ] Lock releases when User A stops dragging → User B can now move it
- [ ] Lock releases after 5 seconds of inactivity
- [ ] User A deletes shape → disappears for User B immediately
- [ ] User A creates shape via click-and-drag → User B sees it appear with random color
- [ ] Preview rectangle shows while dragging to create new shape
- [ ] Minimum size (10x10px) enforced during shape creation
- [ ] One user refreshing mid-edit confirms state persistence
- [ ] Multiple shapes created and moved rapidly to test sync performance (~100ms latency)
- [ ] Test with 500+ rectangles to verify performance target (60 FPS maintained)
- [ ] Cursor movements smooth at 25 FPS with interpolation
- [ ] Presence list shows accurate user count in top-right corner
- [ ] Canvas starts centered at (2500, 2500) with visible grid

---

## Post-MVP: Phase 2 Preparation

**Next PRs (After MVP Deadline):**

- PR #10: Multiple shape types (circles, text)
- PR #11: Shape styling (colors, borders)
- PR #12: Resize and rotate functionality
- PR #13: AI agent integration
- PR #14: Multi-select and grouping
- PR #15: Undo/redo system
