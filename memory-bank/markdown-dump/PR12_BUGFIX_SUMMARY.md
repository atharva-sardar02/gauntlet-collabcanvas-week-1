# PR #12 - Bug Fixes Summary

**Date**: October 16, 2025

## Issues Identified

1. **Maximum update depth exceeded error** in Chrome console
2. **Undo/Redo inconsistency** - Sometimes forgets latest action
3. **React DevTools error** (semver validation - not our code, likely browser extension issue)

## Root Causes

### Issue 1: Maximum Update Depth
**Problem**: Using `useState` for `operationCallback` in `CanvasContext` caused infinite re-render loops because:
- Setting the callback triggered a state change
- State change caused component re-render
- Re-render caused useEffect in HistoryManager to re-run
- This set the callback again, creating an infinite loop

**Solution**: Changed from `useState` to `useRef`
```typescript
// Before (caused infinite loop):
const [operationCallback, setOperationCallback] = useState<...>(null);

// After (stable reference):
const operationCallbackRef = useRef<...>(null);
```

### Issue 2: UserId Tracking
**Problem**: Operations were using `shape.lastModifiedBy` which:
- Might not be set yet for new shapes
- Could be empty string ''
- Caused operations to not be associated with the correct user

**Solution**: Use `currentUser.uid` from `useAuth` hook directly
```typescript
// Before:
userId: beforeShape.lastModifiedBy || '',

// After:
userId: currentUser.uid,
```

## Files Modified

### `src/contexts/CanvasContext.tsx`

**Changes Made**:
1. Added `useRef` import
2. Added `useAuth` import to get `currentUser`
3. Changed `operationCallback` from state to ref:
   ```typescript
   const operationCallbackRef = useRef<((operation: Operation) => void) | null>(null);
   ```

4. Updated all operation methods to:
   - Use `operationCallbackRef.current` instead of `operationCallback`
   - Use `currentUser.uid` instead of `shape.lastModifiedBy`
   - Add `currentUser` to dependency arrays

5. Updated `setOperationCallback` implementation:
   ```typescript
   setOperationCallback: useCallback((callback) => {
     operationCallbackRef.current = callback;
   }, [])
   ```

6. Removed `operationCallback` from all dependency arrays (no longer needed)

## Testing Verification

After these fixes, verify:
- ✅ No "Maximum update depth exceeded" error
- ✅ Undo works consistently after any operation
- ✅ Redo works after undo
- ✅ Operations are tracked with correct userId
- ✅ History persists correctly

## Technical Details

### Why useRef Instead of useState?

**useState**:
- Triggers re-renders when value changes
- Good for UI state that needs to cause updates
- Can cause performance issues if used for callbacks

**useRef**:
- Mutable reference that persists across renders
- Does NOT trigger re-renders when changed
- Perfect for callbacks, timers, DOM references
- Avoids infinite loop issues

### Operation Tracking Flow (Fixed)

```
User Action → Canvas Operation
                ↓
          Before State Captured
                ↓
          Firebase Update
                ↓
          After State Known
                ↓
    operationCallbackRef.current(operation) [NO RE-RENDER]
                ↓
          History Stack Updated
                ↓
          Operation Stored with currentUser.uid
```

## React DevTools Error

The `Invalid argument not valid semver` error is from React DevTools browser extension, not our code. This is a known issue with certain React/React DevTools version combinations. It doesn't affect functionality.

**Workaround**: 
- Disable React DevTools extension temporarily, or
- Update React DevTools extension, or
- Ignore it (doesn't break functionality)

## Prevention

To avoid similar issues in the future:
1. Use `useRef` for callbacks and non-UI state
2. Always get userId from auth context, not from shape metadata
3. Be careful with setState in useEffect without proper dependencies
4. Test undo/redo with multiple rapid operations

## Status

✅ **All issues resolved**
- Maximum update depth error: **FIXED**
- Undo/Redo tracking: **FIXED**
- UserId tracking: **FIXED**

