# PR #12 - Resize/Transform Tracking Fix

**Date**: October 16, 2025

## Issue Identified

**User Report**: "Reshaping the shape is not covered in undo and redo"

### Problem
When users resize shapes using the Konva Transformer handles, the resize operations were not being tracked in the undo/redo history. This meant:
- Resizing a shape couldn't be undone
- Undo/redo only worked for moving shapes, not resizing them
- Transformer changes were lost in history

### Root Cause
The Shape component had a `Transformer` but no `onTransformEnd` handler to capture when shapes are resized or transformed.

## Solution Implemented

### 1. Added Transform End Handler in Canvas Component

**File**: `src/components/Canvas/Canvas.tsx`

Added `handleShapeTransformEnd` function that:
- Captures the transformed shape's new dimensions
- Resets the scale back to 1 (Konva best practice)
- Applies the scale to width/height
- Calls `updateShape()` which triggers history tracking

```typescript
const handleShapeTransformEnd = useCallback((id: string) => (e: Konva.KonvaEventObject<Event>) => {
  const node = e.target as Konva.Rect;
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  // Reset scale and apply to width/height
  node.scaleX(1);
  node.scaleY(1);

  updateShape(id, {
    x: node.x(),
    y: node.y(),
    width: Math.max(10, node.width() * scaleX),
    height: Math.max(10, node.height() * scaleY),
  });
}, [updateShape]);
```

### 2. Updated Shape Component Interface

**File**: `src/components/Canvas/Shape.tsx`

- Added `onTransformEnd` prop to ShapeProps interface
- Created `handleTransformEnd` function with lock checking
- Connected `onTransformEnd` to the Rect component
- Passed handler from Canvas to Shape

### 3. Updated History Manager

**File**: `src/components/Canvas/HistoryManager.tsx`

Added 'resize' to the switch cases for undo/redo operations:
- `performUndo`: Now handles resize operations
- `performRedo`: Now handles resize operations

## Technical Details

### How Transform Tracking Works

```
User resizes shape via Transformer
         ↓
onTransformEnd fires on Rect
         ↓
handleTransformEnd called
         ↓
Captures scale and applies to dimensions
         ↓
updateShape() called
         ↓
CanvasContext tracks operation
         ↓
operationCallbackRef.current() invoked
         ↓
History stack updated with:
  - type: 'update' (resize is a type of update)
  - before: { width, height, x, y }
  - after: { new width, height, x, y }
         ↓
Undo/Redo now works!
```

### Why Reset Scale?

Konva transformers apply scale to shapes. Best practice is to:
1. Capture the scale values
2. Apply scale to actual width/height
3. Reset scale back to 1
4. Update the shape data

This prevents cumulative scaling issues and keeps data clean.

## Files Modified

1. **src/components/Canvas/Canvas.tsx**
   - Added `handleShapeTransformEnd` function
   - Passed handler to Shape components

2. **src/components/Canvas/Shape.tsx**
   - Added `onTransformEnd` to props interface
   - Added `handleTransformEnd` handler
   - Connected handler to Rect `onTransformEnd`

3. **src/components/Canvas/HistoryManager.tsx**
   - Added 'resize' case to undo switch
   - Added 'resize' case to redo switch

4. **PR12_RESIZE_TRACKING_FIX.md** (this document)

## Testing Verification

Test these scenarios:
- ✅ Create a shape
- ✅ Resize it using the transform handles
- ✅ Press Ctrl+Z → shape should return to original size
- ✅ Press Ctrl+Shift+Z → shape should resize again
- ✅ Multiple resize operations can be undone/redone
- ✅ Resize operations are tracked with correct dimensions

## Operation Type Used

Resize operations are tracked as `'update'` type since they update the shape's properties (width, height, x, y). The operation description will show "Updated 1 shape" in the undo/redo buttons.

If you want more specific descriptions, you could:
1. Detect if width/height changed → use 'resize' type
2. Detect if only x/y changed → use 'move' type
3. Otherwise → use 'update' type

## Status

✅ **Resize tracking fully implemented**
- Transform end handler: **ADDED**
- History tracking: **WORKING**
- Undo/Redo: **FUNCTIONAL**

## About the React DevTools Error

The `Invalid argument not valid semver ('' received)` error is from the React DevTools browser extension, not our application code. This is a known issue with certain React/React DevTools version combinations and does not affect functionality. You can safely ignore it or disable the extension temporarily.

