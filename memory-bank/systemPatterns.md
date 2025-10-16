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

Component relationships (high-level)
- `components/Canvas/*` render and manage shapes.
- `components/Collaboration/*` handle presence and cursors.
- `components/Auth/*` manage authentication views and providers.
- `components/UI/*` provide reusable UI elements (toast notifications).
- `hooks/` contain reusable logic (auth, canvas, cursors, presence, keyboard).

Keyboard Shortcuts Pattern
- `useKeyboard` hook: Registers shortcuts with key combinations and handlers
- `useKeyRepeat` hook: Handles continuous key press events (for arrow nudging)
- Prevents default browser behaviors (e.g., Ctrl+D bookmark)
- Ignores shortcuts when typing in input fields
- All shortcuts work only when canvas is focused

Data model (initial)
- Users: minimal profile for presence display.
- Presence: ephemeral, user online state and cursor position.
- Canvas: collection of shapes with position, size, type, and lock state.
- Shapes: can be locked by users during editing to prevent conflicts.


