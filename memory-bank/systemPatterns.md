## System Patterns

Architecture
- SPA built with React + TypeScript via Vite.
- Firebase for auth and realtime data (presence/cursors/shapes).
- Konva/react-konva for canvas rendering and shape interactions.

Key technical decisions
- Use React Context + hooks for app state and services.
- Organize domain logic in `src/services/` and state in `src/contexts/`.
- Encapsulate collaboration (presence/cursors) in dedicated hooks.
- Centralized keyboard shortcut management via custom hooks (`useKeyboard`, `useKeyRepeat`).
- Toast notifications for user feedback on actions.
- Rate limiting and debouncing for Firestore updates to prevent quota exhaustion.

Component relationships (high-level)
- `components/Canvas/*` render and manage shapes, toolbox, context menu.
- `components/Collaboration/*` handle presence and cursors.
- `components/Auth/*` manage authentication views and providers.
- `components/UI/*` provide reusable UI elements (toast notifications, conflict resolution).
- `components/Layout/*` provide navigation and layout structure.
- `hooks/` contain reusable logic (auth, canvas, cursors, presence, keyboard, history, conflicts).

Keyboard Shortcuts Pattern
- `useKeyboard` hook: Registers shortcuts with key combinations and handlers
- `useKeyRepeat` hook: Handles continuous key press events (for arrow nudging)
- Prevents default browser behaviors (e.g., Ctrl+D bookmark)
- Ignores shortcuts when typing in input fields
- All shortcuts work only when canvas is focused
- Comprehensive coverage: tools, editing, alignment, layers, history

Undo/Redo Pattern
- `HistoryContext`: Manages undo/redo stacks with user-scoped operations
- `Operation` types: Track before/after state for all canvas operations
- `HistoryManager` component: Connects history with canvas operations
- User-scoped: Only undoes/redoes current user's operations
- Conflict detection: Warns if shape modified by another user
- Persistence: localStorage saves up to 50 operations per stack
- Stacks cleared on browser reload
- Redo stack cleared on any new canvas change (except during redo)
- Callback pattern: Canvas operations notify history system via callback
- Supported operations: create, delete, move, update, duplicate, transform, reorder
- Shape recreation preserves original IDs for reliable redo

Conflict Resolution Pattern
- **Strategy**: Last-write-wins (LWW) based on server timestamps
- **Optimistic Updates**: Local changes applied immediately, rolled back on conflict
- **Detection**: Tracks editSessionId, version, lastModifiedAt, lastModifiedBy
- **Visual Feedback**: Red flash animation, toast notifications, user badges
- **Conflict Types**: Simultaneous moves, rapid edit storms, delete vs. edit, create collisions
- **Performance**: Rate limiting (max 10 updates/second), debouncing (300ms), batching
- **Logging**: Structured conflict events for debugging
- **Hooks**: `useConflictResolution`, `useOptimisticUpdates`, `useConflictIndicators`

Layer Management Pattern
- **Z-Index Control**: Explicit ordering with normalized integer values
- **Auto-Assignment**: New shapes get maxZIndex + 1 (always on top)
- **Operations**: Bring to front/back, move forward/backward
- **UI**: LayerControls in Toolbox, right-click ContextMenu, keyboard shortcuts
- **Rendering**: Shapes sorted by zIndex before rendering (lower zIndex = behind)
- **Undo/Redo**: 'reorder' operation type tracks zIndex changes
- **Locked Shapes**: Cannot be reordered by other users
- **Utilities**: `src/utils/layers.ts` for all layer logic

Shape Coordinate System
- **Storage**: Top-left (x,y) in Firestore for all shapes
- **Rendering**: 
  - Rectangle, Line, Text, Triangle: Use top-left directly
  - Circle, Star: Convert to center for Konva rendering (x + width/2, y + height/2)
- **Operations**:
  - Drag end: Convert center back to top-left for circle/star
  - Transform end: Convert center back to top-left for circle/star
  - Create: Store as top-left initially

Visual Feedback Patterns
- **Selection**: White border (2px) + white glow for non-text shapes
- **Hover**: 40% opacity + white border (local-only, not synced)
- **Text Selection**: Yellow fill color (no border)
- **Last Editor**: Badge at top-left inside shape, 10-second duration
- **Locked Shapes**: Red border with locker's color
- **Conflicts**: Red flash animation (500ms)

Presence & Inactivity
- **Heartbeat**: 30-second interval to update lastSeen timestamp
- **Inactivity Timeout**: 60 seconds without heartbeat
- **Cleanup**: Firebase onDisconnect handlers + client-side filtering
- **Logout**: Explicit session cleanup before sign-out (while authenticated)

Export Pattern
- **Canvas Export**: Temporarily expand stage to full 5000x5000px, reset position/scale
- **Selection Export**: Clone selected shapes to temporary stage
- **Pixel Ratio**: Configurable (1x, 2x, 3x) for different resolutions
- **Format**: PNG with transparent background
- **UI**: Export button in Navbar with loading indicators

Data model
- Users: minimal profile for presence display.
- Presence: ephemeral, user online state, cursor position, lastSeen timestamp.
- Canvas: collection of shapes with position, size, type, lock state, zIndex.
- Shapes: Support locking, versioning, timestamps, lastModifiedBy metadata.
- Shape Types: rectangle, circle, triangle, star, text (with formatting).
- History: localStorage-based undo/redo stacks (50 operations each).


