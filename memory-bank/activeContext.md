## Active Context

Current focus
- Completed Layer Management system (PR #15.5) with z-index control
- All core features deployed and operational

Recent changes (Latest Session - Oct 17, 2025)
- **Layer Management (PR #15.5) ✅**:
  - Implemented z-index control for shape ordering
  - Created LayerControls in Toolbox with 2-column layout
  - Added right-click ContextMenu for layer operations
  - Keyboard shortcuts for layer reordering
  - Undo/redo tracking for layer changes
  - Clear canvas functionality with confirmation dialog
- **Shape Coordinate Fixes**:
  - Fixed circle and star positioning for all operations (create, drag, resize)
  - Konva center-based coordinates properly converted to/from top-left DB storage
- **Visual Improvements**:
  - "Last edited by" badge repositioned to top-left inside shapes
  - Hover effect: shapes become 40% translucent with white border for visibility
  - Badge displays for 10 seconds after edits
- **Export PNG (PR #13) ✅**:
  - Full canvas export (entire 5000x5000px, not just viewport)
  - Selected shapes export with configurable pixel ratio
  - Export button moved to Navbar header
- **Conflict Resolution (PR #13.5) ✅**:
  - Last-write-wins strategy with server timestamps
  - Optimistic updates with rollback on conflicts
  - Visual conflict indicators (red flash, toasts)
  - Rate limiting and debouncing for performance
- **Text Editing Enhancements**:
  - In-place text editing with formatting (bold, italic, underline)
  - Font size adjustment controls
  - Yellow text color when editing for visibility
- **Alignment Tools (PR #14) ✅**:
  - Full alignment suite (left, right, top, bottom, center-h, center-v)
  - Distribution tools (horizontal, vertical)
  - Multi-select support (Shift+Click)
  - Integrated into Toolbox with keyboard shortcuts

Next steps
- **Implement AI Canvas Agent (PR #19-21)**:
  - Backend: AWS Lambda with LangChain (NOT Firebase Functions)
  - Frontend: Command bar UI (Ctrl+/)
  - Architecture: Firebase Hosting → AWS API Gateway → Lambda → OpenAI
  - Reason: Avoid Firebase Blaze plan requirement for external API calls
- Continue with remaining advanced features (PR #16-18)
- Test collaborative layer management across users
- Add unit tests for layer utilities (PR #15.5.13)
- Monitor performance with complex canvases

Active decisions
- History: 50 operation limit per stack (undo & redo), cleared on browser reload
- Redo stack: Cleared on any new canvas change (unless it's a redo operation)
- Shape coordinates: Top-left for rect/line/text/triangle, center for circle/star
- Layer management: Explicit z-index control with normalized values
- Hover effect: Local-only (not synced), 40% opacity with white border
- Badge positioning: Top-left inside shape for proximity
- Inactivity timeout: Users marked inactive after 60 seconds of no heartbeat
- **AI Agent Backend**: Use AWS Lambda instead of Firebase Functions to avoid Blaze plan requirement
- **AI Architecture**: Firebase Hosting → AWS API Gateway → Lambda (Node.js 20) → OpenAI via LangChain
- **AI Security**: Firebase ID token verification + rate limiting (20 req/min) + idempotency caching


