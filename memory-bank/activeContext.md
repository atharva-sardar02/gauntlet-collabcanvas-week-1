## Active Context

Current focus
- **✅ DEPLOYMENT COMPLETE - Oct 17, 2025**
- AWS Lambda backend deployed with enhanced AI agent
- Firebase Hosting frontend deployed with all features
- Comprehensive robustness layer for natural language commands
- All systems live and operational at https://collabcanvas-f7ee2.web.app

Recent changes (Latest Session - Oct 17, 2025 - Final)
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

Recent Major Implementations (Oct 17, 2025 Final Session - DEPLOYED ✅)
- **AI Canvas Agent (PR #19-21) ✅ COMPLETE & LIVE**:
  - AWS Lambda backend with LangChain + OpenAI GPT-4
  - 13 AI tools (getShapes, createShape, moveShape, resizeShape, rotateShape, updateShape, deleteShape, align, distribute, createText, bulkCreateShapes, createComplexLayout)
  - Agent loop for complex multi-step commands (500+ shapes in one command)
  - Command bar UI with Ctrl+/ shortcut, history, progress tracking
  - Auto-navigation to created shapes
  - Hybrid approach: LLM plans + server-side geometry computation
  - **Robustness Layer**:
    * Natural language flexibility ("make it bigger", "rotate it", "the blue one")
    * Smart defaults for missing information (position, size, color, angle)
    * Ambiguous reference resolution ("it", "them", "that thing")
    * Action verb interpretation ("spin", "expand", "shrink", "line up")
    * Context understanding ("organize them", "clean it up", "center it")
    * 10 color keyword mappings (red, blue, green, yellow, etc.)
    * Typo handling ("recangle" → rectangle, "cirlce" → circle)
    * Proactive shortcuts ("create a form" → login form layout)
    * Error recovery and graceful handling
  - Visual effects support (opacity 0-1, 12 blend modes)
  - Complex layouts with professional styling
  - ALL 6 original issues fixed and verified
- **Infinite Canvas ✅ COMPLETE**:
  - Removed fixed 5000x5000 boundaries
  - Dynamic viewport-based grid rendering
  - Origin (0,0) highlighted with thicker lines
  - Negative coordinates supported
  - Smart export with bounding box calculation
- **Multi-Selection Enhancements ✅ COMPLETE**:
  - All actions work on multiple shapes (delete, duplicate, nudge, layer ops)
  - Group transformer with bounding box for 2+ selected shapes
  - Context menu shows selection count
  - Distribution fix: works perfectly in one click
- **Rotation Synchronization ✅ COMPLETE**:
  - Rotation values saved to Firestore
  - All users see synced rotations in real-time
- **UI/UX Improvements ✅ COMPLETE**:
  - AI Agent button in navbar (center, expandable)
  - Online users dropdown with count
  - User menu with conditional password change feature
  - Movable, compact toolbox with toggle button
  - Full-window layout (no browser scrollbars)
  - Dark theme throughout (removed gradients)
  - Better cursor contrast (WCAG compliant)
  - Last edited marker (hidden for own edits)
- **Documentation Organization ✅ COMPLETE**:
  - Core docs moved to `docs/` folder (PRD, architecture, tasks)
  - Root markdown files archived in `markdown-dump/`
  - Deployment commands documented

Next steps
- ✅ **AI Agent Improvements** - Robustness layer complete
- ✅ **Deployment** - AWS Lambda + Firebase Hosting live
- **Testing** - Verify all AI commands work correctly in production
- **Rubric Evaluation** - Assess against grading criteria
- Demo video preparation
- AI Development Log completion
- Performance validation (500+ objects, 5+ users)

Active decisions
- **Canvas Architecture**: Infinite canvas (no boundaries), dynamic grid rendering based on viewport
- **Canvas Export**: Smart bounding box calculation with 100px padding
- **History**: 50 operation limit per stack (undo & redo), cleared on browser reload
- **Redo stack**: Cleared on any new canvas change (unless it's a redo operation)
- **Shape coordinates**: Top-left for rect/line/text/triangle, center for circle/star
- **Rotation**: Stored in degrees, synced to Firestore for real-time collaboration
- **Layer management**: Explicit z-index control with normalized values
- **Multi-selection**: Group transformer for 2+ shapes, all operations affect all selected
- **Hover effect**: Local-only (not synced), 40% opacity with white border
- **Badge positioning**: Top-left inside shape, hidden for own edits
- **Inactivity timeout**: Users marked inactive after 60 seconds of no heartbeat
- **AI Agent Backend**: AWS Lambda with LangChain (not Firebase Functions to avoid Blaze plan)
- **AI Architecture**: Firebase Hosting → AWS API Gateway → Lambda (Node.js 20) → OpenAI
- **AI Security**: Firebase ID token verification + rate limiting (20 req/min) + idempotency caching
- **AI Bulk Operations**: Server-side geometry computation for 100+ shapes, single Firestore write
- **Distribution Algorithm**: Pre-calculate all positions in one pass for one-click distribution


