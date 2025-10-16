# Conflict Resolution Strategy

**Version:** 1.0  
**Last Updated:** October 16, 2025  
**Strategy:** Last-Write-Wins (LWW) with Firestore Server Timestamps

---

## Overview

CollabCanvas uses a **Last-Write-Wins (LWW)** conflict resolution strategy combined with Firestore's real-time synchronization to handle simultaneous edits by multiple users. This document explains how conflicts are detected, resolved, and communicated to users.

---

## Core Strategy: Last-Write-Wins (LWW)

### How It Works

When multiple users edit the same shape simultaneously:

1. **Each edit includes a Firestore server timestamp**
2. **The edit with the most recent timestamp wins**
3. **Earlier edits are overwritten**
4. **Users receive visual feedback when their edit is overwritten**

### Example

```
Timeline:
T1: User A moves shape to (100, 100)
T2: User B moves shape to (200, 200) [20ms later]

Result:
- Shape ends at (200, 200) [T2 is more recent]
- User A sees conflict indicator: "Your move was overwritten by User B"
- User B sees no conflict (their edit won)
```

---

## Why Last-Write-Wins?

### Pros
- ✅ **Simple & Predictable:** Easy for users to understand
- ✅ **Firestore Native:** Works seamlessly with Firestore's serverTimestamp()
- ✅ **No Complex Algorithms:** No Operational Transform or CRDT needed
- ✅ **Proven at Scale:** Used by Google Docs, Figma, Miro, etc.
- ✅ **Performance:** Minimal computational overhead

### Cons
- ⚠️ **Work Can Be Lost:** Earlier edits are discarded
- ⚠️ **No Automatic Merging:** Changes don't merge intelligently
- ⚠️ **Requires User Awareness:** Users must watch for conflict notifications

### Why Not CRDT or OT?
- **Complexity:** Operational Transform and CRDT are significantly more complex
- **Overhead:** Require more computational resources and larger payloads
- **Overkill:** For a design canvas, LWW provides sufficient collaboration
- **Trade-off:** The simplicity gain outweighs the occasional lost edit

---

## Conflict Detection

### Shape Version Tracking

Every shape includes metadata for conflict detection:

```typescript
interface Shape {
  id: string;
  version: number;              // Increments on each edit
  lastModifiedTimestamp: number; // Firestore server timestamp
  lastModifiedBy: string;        // User ID who made last edit
  editSessionId?: string;        // Current edit session ID
  // ... other properties
}
```

### Detection Process

1. **Local Edit:** User makes change, applied optimistically
2. **Send to Server:** Update sent to Firestore with new version + timestamp
3. **Receive Remote Update:** Remote change arrives from Firestore
4. **Compare Timestamps:** If remote timestamp > local timestamp
5. **Conflict Detected:** Local edit is overwritten by remote
6. **Show Feedback:** Display conflict indicator to user

---

## Conflict Types

### 1. Simultaneous Move
**Scenario:** Two users drag the same shape at the same time

**Resolution:**
- Last drag update wins (based on server timestamp)
- Loser sees shape jump to winner's position
- Conflict indicator shown for 2 seconds

**Visual Feedback:**
```
User A: Red flash + Toast: "Your move was overwritten by User B"
User B: No indication (they won)
```

### 2. Rapid Edit Storm
**Scenario:** Multiple rapid edits (resize, color, move) on same shape

**Resolution:**
- Each property resolved independently (LWW per field)
- Batched updates sent every 100ms
- Rate limiting prevents quota exhaustion

**Behavior:**
- Users may see temporary inconsistencies (< 200ms)
- All users converge to same final state
- No property corruption

### 3. Delete vs Edit
**Scenario:** User A deletes shape while User B is editing it

**Resolution:**
- Delete always wins (delete is final)
- Editing user's updates after delete are ignored
- Toast shown: "Shape was deleted by [User A]"

**Optional:**
- "Undo delete" button creates new shape with edits

### 4. Create Collision
**Scenario:** Two users create shapes at nearly identical timestamps

**Resolution:**
- Both shapes exist (Firestore generates unique IDs)
- No conflict (shapes are independent)
- Overlap is acceptable

---

## Visual Feedback Mechanisms

### Conflict Indicators

When a user's edit is overwritten:

1. **Red Flash Animation (2 seconds)**
   - Shape flashes red border
   - Pulse effect draws attention
   
2. **Toast Notification**
   - Message: "Your change was overwritten by [User Name]"
   - Auto-dismisses after 4 seconds
   - Manual close button available

3. **Shape Highlight**
   - Temporary indicator showing last editor
   - Displays user's cursor color
   - Fades out after 2 seconds

### Lock Indicators

When a shape is being actively edited:

1. **Colored Border**
   - Border color matches editor's cursor color
   - Indicates shape is in use

2. **User Badge**
   - Small badge showing editor's name
   - Positioned near shape

3. **Tooltip**
   - Hover shows: "Being edited by [User Name]"

---

## Optimistic Updates

### How It Works

1. **Instant Application:** Changes applied to local state immediately (< 16ms)
2. **Pending Queue:** Operation added to pending queue with timeout
3. **Server Sync:** Update sent to Firestore asynchronously
4. **Confirmation:** Server confirms operation, removed from pending
5. **Rollback:** If server rejects or timeout, revert local change

### Benefits

- ✅ **Zero Perceived Latency:** UI feels instant
- ✅ **Smooth UX:** No waiting for network round-trip
- ✅ **Conflict Aware:** Can detect and handle conflicts

### Implementation

```typescript
// Apply optimistically
applyOptimistic(operation);  // Update local state immediately

// Send to server
sendToFirestore(operation);

// Wait for confirmation
onServerConfirm(() => {
  confirmOptimistic(operation.id);  // Remove from pending
});

// Handle timeout or rejection
onTimeout(() => {
  rollbackOptimistic(operation);  // Revert local state
  showConflictIndicator();
});
```

---

## Rate Limiting

To prevent Firestore quota exhaustion and state corruption:

### Limits

- **Max Updates:** 10 updates per second per shape
- **Batching:** Updates batched every 100ms
- **Debouncing:** Drag updates debounced by 100ms
- **Throttling:** Rapid edits throttled to limit

### Queue Behavior

When rate limit exceeded:
1. Updates queued locally
2. Sent in next available time window
3. User sees changes immediately (optimistic)
4. Server receives batched updates

---

## Known Edge Cases

### 1. Network Partition
**Scenario:** User loses connection mid-edit

**Handling:**
- Updates queued locally
- Synced on reconnection
- Offline indicator shown
- Conflict detection on sync

### 2. Clock Skew
**Scenario:** User's device clock is incorrect

**Handling:**
- **Always use Firestore serverTimestamp()**
- Never rely on client Date.now()
- Server time is source of truth

### 3. Orphaned Locks
**Scenario:** User closes browser without releasing lock

**Handling:**
- Automatic timeout after 5 seconds of inactivity
- Lock released on browser close (via onDisconnect)
- Other users can acquire lock after timeout

### 4. Concurrent Deletes
**Scenario:** Two users delete same shape

**Handling:**
- First delete wins
- Second delete is no-op (shape already gone)
- No error shown

### 5. Undo After Conflict
**Scenario:** User undoes, but shape was changed by others

**Handling:**
- Undo uses historical snapshot
- May create new conflict if shape changed
- Conflict resolution applies again

---

## Performance Targets

| Metric | Target | Measured |
|--------|--------|----------|
| Conflict Detection Latency | < 50ms | TBD |
| Visual Feedback Delay | < 100ms | TBD |
| Optimistic Update | < 16ms | TBD |
| Rollback Time | < 100ms | TBD |
| Max Pending Operations | 50 per user | N/A |
| Rate Limit | 10 updates/sec | N/A |

---

## Testing Strategy

### Automated Tests

1. **Simultaneous Move Test**
   - Two users drag same shape
   - Verify last write wins
   - Check conflict indicator

2. **Rapid Edit Storm Test**
   - Multiple rapid edits (resize, color, move)
   - Verify no corruption
   - Check convergence

3. **Delete vs Edit Test**
   - Delete during active edit
   - Verify delete wins
   - Check toast notification

4. **Create Collision Test**
   - Two simultaneous creates
   - Verify both exist
   - Check unique IDs

### Manual Testing

See testing scenarios in tasks.md PR #13.5 for detailed test scripts.

---

## Future Improvements

### Potential Enhancements (Not Implemented)

1. **Operational Transform (OT)**
   - Intelligent merging of concurrent edits
   - More complex but preserves both edits

2. **CRDT (Conflict-free Replicated Data Types)**
   - Mathematically guaranteed convergence
   - No conflicts, only merges

3. **Custom Conflict Policies**
   - User chooses "always keep mine" or "always accept others"
   - Per-user preferences

4. **Conflict History**
   - Review and revert past conflicts
   - Audit log of overwrites

5. **Three-Way Merge**
   - Find common ancestor
   - Merge both changes when possible

---

## References

- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Figma's Multiplayer Technology](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Google Docs Operational Transform](https://drive.googleblog.com/2010/09/whats-different-about-new-google-docs.html)
- [Last-Write-Wins vs CRDT](https://crdt.tech/)

---

**Document Version:** 1.0  
**Status:** Active  
**Next Review:** After initial user testing

