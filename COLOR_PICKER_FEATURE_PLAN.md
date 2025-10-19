# Color Picker Feature - Implementation Plan

## 🎯 Feature Overview

Add a comprehensive color picker to the canvas toolbox that allows users to:
1. Pick any color using a visual color picker
2. See and reuse recently used colors
3. Create and manage saved color palettes
4. Apply colors to selected shapes
5. Set default colors for new shapes

---

## 📐 Design Specifications

### Visual Layout

```
┌─────────────────────────────────────┐
│  Color Picker                    [×]│
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Color Wheel / Picker      │   │
│  │   (Interactive HSV/RGB)     │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Hex: #3B82F6  [    Copy    ]      │
│  RGB: 59, 130, 246                 │
│  Opacity: ████████░░ 80%           │
│                                     │
├─────────────────────────────────────┤
│  Recent Colors (Last 10)            │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐            │
│  │█│█│█│█│█│█│█│█│█│█│            │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘            │
├─────────────────────────────────────┤
│  Saved Palettes                [+]  │
│                                     │
│  Default Palette                    │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐            │
│  │█│█│█│█│█│█│█│█│█│█│            │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘            │
│                                     │
│  Custom Palette 1           [⚙][×] │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐            │
│  │█│█│█│█│█│█│█│█│█│█│            │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘            │
├─────────────────────────────────────┤
│  [Apply to Selection] [Set Default] │
└─────────────────────────────────────┘
```

### Interaction Flow

1. **Open Color Picker**: Click color swatch in toolbox
2. **Pick Color**: 
   - Use color wheel/picker to select hue, saturation, brightness
   - Adjust opacity slider
   - Enter hex code manually
   - Or click a recent/palette color
3. **Apply Color**:
   - Click "Apply to Selection" to change selected shape(s)
   - Click "Set Default" to use for new shapes
4. **Manage Palettes**:
   - Click [+] to create new palette
   - Click [⚙] to rename/reorder colors
   - Click [×] to delete palette

---

## 🏗️ Technical Architecture

### New Components

```typescript
// src/components/Canvas/ColorPicker/
├── ColorPicker.tsx           // Main modal component
├── ColorWheel.tsx            // Interactive color picker (HSV)
├── ColorInput.tsx            // Hex/RGB input fields
├── OpacitySlider.tsx         // Opacity control (0-100%)
├── RecentColors.tsx          // Recent colors grid
├── PaletteManager.tsx        // Saved palettes UI
├── PaletteItem.tsx           // Individual palette component
└── ColorSwatch.tsx           // Reusable color square

// src/hooks/
├── useColorPicker.ts         // Color picker state & logic
└── useColorPalettes.ts       // Palette management

// src/services/
└── colorPalettes.ts          // Firestore palette CRUD

// src/contexts/
└── ColorContext.tsx          // Global color state (optional)

// src/utils/
└── colorUtils.ts             // Color conversion utilities
```

### Data Models

```typescript
// Color interface
interface Color {
  hex: string;          // "#3B82F6"
  rgb: {
    r: number;          // 0-255
    g: number;
    b: number;
  };
  hsv: {
    h: number;          // 0-360
    s: number;          // 0-100
    v: number;          // 0-100
  };
  opacity: number;      // 0-1
  timestamp?: number;   // For recent colors
}

// Palette interface
interface ColorPalette {
  id: string;
  name: string;
  colors: string[];     // Array of hex codes
  userId: string;       // Owner
  isDefault: boolean;   // System palette vs user palette
  createdAt: number;
  updatedAt: number;
  order: number;        // Display order
}

// User preferences
interface ColorPreferences {
  defaultFillColor: string;
  defaultStrokeColor: string;
  recentColors: string[];     // Max 10, FIFO
  activePaletteId: string;    // Currently selected palette
}
```

### Firestore Schema

```
users/{userId}/
  ├── colorPreferences/
  │   └── preferences (document)
  │       ├── defaultFillColor: string
  │       ├── defaultStrokeColor: string
  │       ├── recentColors: string[]
  │       └── activePaletteId: string
  │
  └── colorPalettes/
      ├── {paletteId} (document)
      │   ├── name: string
      │   ├── colors: string[]
      │   ├── isDefault: boolean
      │   ├── createdAt: timestamp
      │   ├── updatedAt: timestamp
      │   └── order: number
      └── ...
```

---

## 🔨 Implementation Tasks

### Phase 1: Basic Color Picker (4-5 hours)

**Task 1.1: Color Utility Functions**
- [ ] Create `src/utils/colorUtils.ts`
- [ ] Implement hex ↔ RGB conversion
- [ ] Implement RGB ↔ HSV conversion
- [ ] Implement color validation
- [ ] Add opacity/alpha channel support
- [ ] Write unit tests

**Task 1.2: Core Color Picker Component**
- [ ] Create `ColorPicker.tsx` modal component
- [ ] Integrate react-color or build custom color wheel
- [ ] Add hex input field with validation
- [ ] Add RGB input fields
- [ ] Add opacity slider
- [ ] Add live preview swatch
- [ ] Style with dark theme (match app UI)

**Task 1.3: Toolbox Integration**
- [ ] Add color swatch button to `Toolbox.tsx`
- [ ] Show current fill/stroke colors
- [ ] Open ColorPicker modal on click
- [ ] Update selected shape(s) on color change
- [ ] Add keyboard shortcut (e.g., `C` key)

**Task 1.4: Shape Color Updates**
- [ ] Update `CanvasContext.tsx` with `updateShapeColor()` method
- [ ] Apply color to single selected shape
- [ ] Apply color to multiple selected shapes
- [ ] Update Firestore with new color
- [ ] Sync changes across all users

**Deliverable**: Working color picker that can change shape colors

---

### Phase 2: Recent Colors (2-3 hours)

**Task 2.1: Recent Colors Storage**
- [ ] Create `useColorPicker` hook
- [ ] Store recent colors in localStorage (client-side)
- [ ] Implement FIFO queue (max 10 colors)
- [ ] Deduplicate colors (don't add if already in list)
- [ ] Load recent colors on app init

**Task 2.2: Recent Colors UI**
- [ ] Create `RecentColors.tsx` component
- [ ] Display color grid (10 swatches)
- [ ] Add click handler to apply recent color
- [ ] Add hover tooltip showing hex code
- [ ] Add "Clear recent colors" button

**Task 2.3: Auto-tracking**
- [ ] Track colors when applied via picker
- [ ] Track colors when shapes are created by AI
- [ ] Track colors when duplicating shapes
- [ ] Don't track when color is from palette

**Deliverable**: Recent colors section that auto-populates

---

### Phase 3: Saved Palettes (5-6 hours)

**Task 3.1: Firestore Service**
- [ ] Create `src/services/colorPalettes.ts`
- [ ] Implement `createPalette(name, colors)`
- [ ] Implement `updatePalette(id, updates)`
- [ ] Implement `deletePalette(id)`
- [ ] Implement `getUserPalettes(userId)`
- [ ] Add real-time listener for palette updates

**Task 3.2: Palette Manager Hook**
- [ ] Create `useColorPalettes.ts` hook
- [ ] Load user's palettes from Firestore
- [ ] Provide CRUD operations
- [ ] Handle loading/error states
- [ ] Sync changes across tabs

**Task 3.3: Default Palettes**
- [ ] Create system default palettes (read-only)
  - Material Design colors
  - Tailwind CSS colors
  - Brand colors (blues, purples)
  - Grayscale
  - Pastels
- [ ] Store in `src/utils/defaultPalettes.ts`
- [ ] Display before user palettes

**Task 3.4: Palette UI Components**
- [ ] Create `PaletteManager.tsx` container
- [ ] Create `PaletteItem.tsx` for each palette
- [ ] Add "New Palette" button with modal
- [ ] Add rename palette functionality
- [ ] Add delete palette confirmation
- [ ] Add drag-to-reorder palettes
- [ ] Add "Add current color" to palette

**Task 3.5: Palette Editing**
- [ ] Create palette editor modal
- [ ] Add color to palette (click + to add current color)
- [ ] Remove color from palette (click × on swatch)
- [ ] Reorder colors (drag and drop)
- [ ] Set max colors per palette (e.g., 20)
- [ ] Save changes to Firestore

**Deliverable**: Full palette management system

---

### Phase 4: Advanced Features (3-4 hours)

**Task 4.1: Default Colors**
- [ ] Add "Set as Default Fill" button
- [ ] Add "Set as Default Stroke" button
- [ ] Store in user preferences (Firestore)
- [ ] Apply to newly created shapes
- [ ] Show default colors in toolbox

**Task 4.2: Color Eyedropper**
- [ ] Add eyedropper button in color picker
- [ ] Use browser's EyeDropper API (if available)
- [ ] Fallback: Click canvas shape to pick its color
- [ ] Update color picker with picked color

**Task 4.3: Gradient Support (Future)**
- [ ] Design gradient picker UI
- [ ] Support linear gradients
- [ ] Support radial gradients
- [ ] Update shape renderer to support gradients
- [ ] Store gradient data in shape properties

**Task 4.4: AI Integration**
- [ ] Add AI tool: `suggestColorPalette(description)`
- [ ] Example: "Suggest a sunset color palette"
- [ ] Use OpenAI to generate 5-10 complementary colors
- [ ] Create palette from AI suggestions
- [ ] Add to user's saved palettes

**Deliverable**: Enhanced color picker with pro features

---

## 🎨 UI/UX Considerations

### Design Principles

1. **Non-blocking**: Use modal/popover, don't take over entire screen
2. **Fast Access**: Keyboard shortcut + toolbox button
3. **Context-aware**: Show current color of selected shape
4. **Visual Feedback**: Live preview of color changes
5. **Accessible**: Keyboard navigation, ARIA labels

### User Flows

**Flow 1: Quick Color Change**
```
1. User selects a shape
2. Clicks color swatch in toolbox
3. Clicks a recent color
4. Color applied instantly
5. Picker closes (or stays open if shift-clicked)
```

**Flow 2: Custom Color**
```
1. User opens color picker
2. Uses color wheel to find desired hue
3. Adjusts saturation/brightness
4. Adjusts opacity slider
5. Clicks "Apply to Selection"
6. Color added to recent colors
```

**Flow 3: Create Palette**
```
1. User creates several shapes with different colors
2. Opens color picker
3. Clicks "New Palette" button
4. Names palette "My Brand Colors"
5. For each shape color:
   - Clicks the shape
   - Opens color picker
   - Clicks "Add to Palette"
6. Palette saved to Firestore
7. Available across all sessions
```

### Responsive Design

- **Desktop**: Full color picker modal (400px wide)
- **Tablet**: Slightly smaller modal (350px wide)
- **Mobile**: Full-screen color picker (better touch targets)

---

## 📚 Library Recommendations

### Option 1: react-color (Popular, 17k+ stars)
```bash
npm install react-color
npm install --save-dev @types/react-color
```

**Pros:**
- Battle-tested, mature library
- Multiple picker styles (Chrome, Sketch, Compact)
- Good TypeScript support
- Easy to customize

**Cons:**
- Last updated 2 years ago
- Large bundle size (~100KB)
- Less modern UI

### Option 2: react-colorful (Modern, 3k+ stars)
```bash
npm install react-colorful
```

**Pros:**
- Tiny bundle size (~3KB)
- Modern, customizable
- Active maintenance
- Great TypeScript support
- Tree-shakeable

**Cons:**
- Fewer built-in picker styles
- Need to build custom UI around it

### Option 3: Build Custom (Recommended for CollabCanvas)

**Why Custom:**
- Full control over UI/UX
- Matches app's dark theme perfectly
- Learn color theory fundamentals
- Smaller bundle size (only what we need)
- Better integration with Konva/Canvas

**How:**
- Canvas 2D API for color wheel
- Input sliders for HSV/RGB
- Custom styled with Tailwind CSS
- ~200 lines of code

**Recommendation**: Start with react-colorful for Phase 1 (speed), consider custom implementation in Phase 4 (polish).

---

## 🔌 Integration Points

### 1. Toolbox Component
```typescript
// src/components/Canvas/Toolbox.tsx

const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
const [currentColor, setCurrentColor] = useState('#3B82F6');

// Add color swatch button
<button
  onClick={() => setIsColorPickerOpen(true)}
  className="relative w-12 h-12 rounded-lg border-2 border-gray-600"
  style={{ backgroundColor: currentColor }}
  title="Color Picker (C)"
>
  {/* Color preview */}
</button>

{isColorPickerOpen && (
  <ColorPicker
    initialColor={currentColor}
    onColorChange={handleColorChange}
    onClose={() => setIsColorPickerOpen(false)}
  />
)}
```

### 2. Canvas Context
```typescript
// src/contexts/CanvasContext.tsx

const updateShapeColor = useCallback(
  async (shapeIds: string[], color: string, type: 'fill' | 'stroke') => {
    const updates = { [type]: color };
    
    // Update all selected shapes
    for (const id of shapeIds) {
      await updateShape(id, updates);
    }
    
    // Track in recent colors
    addToRecentColors(color);
    
    // Add to history for undo/redo
    addToHistory({
      type: 'updateColor',
      shapeIds,
      before: shapes.filter(s => shapeIds.includes(s.id)),
      after: { color, type },
    });
  },
  [updateShape, shapes, addToRecentColors, addToHistory]
);
```

### 3. AI Agent Integration
```typescript
// aws-lambda/src/aiAgent.ts

// Add new tool for color palette suggestions
{
  name: 'suggestColorPalette',
  description: 'Generate a color palette based on description',
  schema: z.object({
    description: z.string(),
    numColors: z.number().min(3).max(10).default(5),
  }),
  func: async (input) => {
    // Use GPT to generate complementary colors
    const prompt = `Generate ${input.numColors} hex color codes for: ${input.description}`;
    // Return array of hex codes
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Color conversion functions (hex ↔ RGB ↔ HSV)
- [ ] Color validation (valid hex, RGB ranges)
- [ ] Recent colors FIFO logic
- [ ] Palette CRUD operations

### Integration Tests
- [ ] Color picker opens/closes correctly
- [ ] Color updates selected shape in Firestore
- [ ] Recent colors persist across sessions
- [ ] Palettes sync across tabs
- [ ] Multi-shape color update

### E2E Tests
- [ ] User selects shape and changes color
- [ ] User creates custom palette
- [ ] User applies palette color to multiple shapes
- [ ] Recent colors update when shapes created

### Visual Regression Tests
- [ ] Color picker modal appearance
- [ ] Recent colors grid layout
- [ ] Palette manager layout
- [ ] Dark theme consistency

---

## 📊 Performance Considerations

### Optimization Strategies

1. **Debounce Color Updates**
   - Don't update Firestore on every slider move
   - Wait 300ms after user stops adjusting
   - Show live preview locally

2. **Lazy Load Palettes**
   - Load default palettes immediately
   - Load user palettes in background
   - Cache in memory for session

3. **Virtualize Color Grid**
   - If user has 100+ palettes, use virtual scrolling
   - Render only visible palette items

4. **Optimize Color Conversions**
   - Memoize expensive HSV ↔ RGB calculations
   - Cache recent conversions

5. **Bundle Size**
   - Use react-colorful (3KB) instead of react-color (100KB)
   - Code split color picker (load only when opened)

---

## 🚀 Deployment Plan

### Phase 1 Deployment (Basic Picker)
```bash
# 1. Implement core color picker
# 2. Test locally
npm run dev

# 3. Build and test production build
npm run build
npm run preview

# 4. Deploy frontend
firebase deploy --only hosting

# 5. Verify in production
# Open app, test color picker on shapes
```

### Phase 2-3 Deployment (Recent + Palettes)
```bash
# 1. Update Firestore security rules
# Add rules for colorPalettes collection

# 2. Deploy rules first
firebase deploy --only firestore:rules

# 3. Build and deploy app
npm run build
firebase deploy --only hosting

# 4. Test with multiple users
# Verify palettes sync correctly
```

### Phase 4 Deployment (Advanced Features)
```bash
# 1. Update Lambda if adding AI palette generation
cd aws-lambda
npm run build
# Deploy Lambda

# 2. Deploy frontend with new features
cd ..
npm run build
firebase deploy --only hosting
```

---

## 📈 Success Metrics

### User Engagement
- % of users who open color picker
- Average colors used per session
- Number of custom palettes created

### Performance
- Color picker open time < 200ms
- Color update latency < 100ms
- Palette load time < 500ms

### Quality
- Zero color picker-related bugs in first week
- 95%+ color conversion accuracy
- No UI jank during color wheel interaction

---

## 🎯 Acceptance Criteria

### Phase 1: Basic Picker ✓
- [ ] User can open color picker from toolbox
- [ ] User can select color using visual picker
- [ ] User can enter hex code manually
- [ ] User can adjust opacity (0-100%)
- [ ] Color updates selected shape in real-time
- [ ] Color picker has dark theme styling

### Phase 2: Recent Colors ✓
- [ ] Last 10 colors are displayed
- [ ] Recent colors persist across sessions
- [ ] Clicking recent color applies it immediately
- [ ] Duplicate colors are not added
- [ ] User can clear recent colors

### Phase 3: Saved Palettes ✓
- [ ] User can create new palette
- [ ] User can rename palette
- [ ] User can delete palette
- [ ] User can add color to palette
- [ ] User can remove color from palette
- [ ] Palettes sync to Firestore
- [ ] Default palettes are available
- [ ] User can reorder palettes

### Phase 4: Advanced Features ✓
- [ ] User can set default fill/stroke color
- [ ] User can use eyedropper tool
- [ ] AI can suggest color palettes
- [ ] Keyboard shortcuts work (C for color picker)

---

## 🔮 Future Enhancements

### Phase 5: Pro Features
- [ ] Gradient support (linear, radial)
- [ ] Color harmony suggestions (complementary, triadic)
- [ ] Import palette from image
- [ ] Export palette as CSS/JSON/ASE
- [ ] Color accessibility checker (WCAG contrast)
- [ ] Popular palette library (community-shared)
- [ ] Color history timeline (undo for color changes only)

### Phase 6: Team Features
- [ ] Shared team palettes (org-wide)
- [ ] Palette version control
- [ ] Palette comments/annotations
- [ ] Lock palette colors (read-only)

---

## 🛠️ Development Timeline

### Estimated Total Time: 14-18 hours

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| Phase 1 | Basic Color Picker | 4-5 hours | High |
| Phase 2 | Recent Colors | 2-3 hours | High |
| Phase 3 | Saved Palettes | 5-6 hours | Medium |
| Phase 4 | Advanced Features | 3-4 hours | Low |
| Testing | All phases | 2-3 hours | High |

### Recommended Approach
1. **Week 1**: Phase 1 + Phase 2 (6-8 hours)
   - Get basic functionality working
   - User can pick and apply colors
   - Recent colors for convenience

2. **Week 2**: Phase 3 (5-6 hours)
   - Add palette management
   - Test with real users
   - Gather feedback

3. **Week 3**: Phase 4 + Polish (3-4 hours)
   - Add advanced features based on feedback
   - Performance optimization
   - Final testing

---

## 📝 Implementation Checklist

### Prerequisites
- [ ] Choose color picker library (react-colorful recommended)
- [ ] Install dependencies: `npm install react-colorful`
- [ ] Review existing color handling in codebase
- [ ] Plan Firestore schema for palettes

### Core Development
- [ ] Implement color utility functions
- [ ] Create ColorPicker component
- [ ] Add to Toolbox with keyboard shortcut
- [ ] Implement recent colors tracking
- [ ] Build palette management UI
- [ ] Create Firestore service for palettes
- [ ] Add default system palettes

### Integration
- [ ] Update CanvasContext with color methods
- [ ] Add history support for color changes
- [ ] Test multi-user color sync
- [ ] Add AI palette generation tool (optional)

### Testing & Polish
- [ ] Write unit tests for color utils
- [ ] E2E test color picker flow
- [ ] Verify dark theme consistency
- [ ] Test on mobile devices
- [ ] Performance profiling

### Documentation
- [ ] Update README with color picker feature
- [ ] Document color utility functions
- [ ] Add JSDoc comments
- [ ] Create user guide for palettes

### Deployment
- [ ] Update Firestore security rules
- [ ] Build production bundle
- [ ] Deploy to Firebase Hosting
- [ ] Monitor for errors
- [ ] Gather user feedback

---

## 💡 Implementation Tips

### Best Practices
1. **Start Simple**: Get basic picker working before adding palettes
2. **Use Existing Patterns**: Follow Layers Panel architecture for palette UI
3. **Real-time Sync**: Use Firestore listeners for palette updates
4. **Keyboard First**: Add shortcuts for power users (C for color picker)
5. **Accessibility**: Ensure color picker is keyboard-navigable
6. **Performance**: Debounce updates, memoize conversions
7. **Mobile-friendly**: Large touch targets, responsive layout

### Common Pitfalls to Avoid
- ❌ Not debouncing color updates (spams Firestore)
- ❌ Converting colors on every render (performance issue)
- ❌ Not validating hex input (crashes on invalid input)
- ❌ Forgetting opacity in color representation
- ❌ Not syncing palette changes across tabs
- ❌ Making picker too large (blocks canvas view)
- ❌ Not handling color picker when no shape selected

### Code Quality
- Use TypeScript strict mode
- Add PropTypes/interfaces for all components
- Extract color logic to utils (testable)
- Use custom hooks for state management
- Follow existing naming conventions
- Add meaningful comments for complex logic

---

## 📞 Support & Resources

### Documentation
- [react-colorful docs](https://github.com/omgovich/react-colorful)
- [Color theory basics](https://www.colormatters.com/color-and-design/basic-color-theory)
- [HSV color model](https://en.wikipedia.org/wiki/HSL_and_HSV)
- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)

### Design Inspiration
- [Adobe Color](https://color.adobe.com/) - Color wheel & palettes
- [Coolors](https://coolors.co/) - Palette generator
- [Figma color picker](https://www.figma.com/community/file/872734417182506964)
- [Material Design colors](https://material.io/design/color/the-color-system.html)

---

## ✅ Summary

This feature will add professional-grade color management to CollabCanvas, enabling users to:
- Pick any color visually or by hex code
- Quickly reuse recent colors (FIFO queue of 10)
- Create and manage custom color palettes
- Sync palettes across devices via Firestore
- Use AI to generate complementary color schemes

**Total Effort**: 14-18 hours (3-4 focused work sessions)

**Value**: High - Essential for any design/canvas tool, significantly improves UX

**Risk**: Low - Well-defined scope, proven libraries available, clear integration points

**Recommended Start**: Phase 1 (Basic Picker) to get immediate user value, then iterate based on feedback.

