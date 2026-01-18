# Tab View Counter Feature

## Overview

The tab view counter feature tracks unique page visits for harmonica tabs using session storage to prevent refresh abuse. Each approved tab displays its view count, and views are only counted once per browser session.

## Implementation Details

### Database Schema

Added `view_count` column to the `harmonica_tabs` table:
- Type: `INTEGER`
- Default: `0`
- Auto-migrates existing tables via `initializeDatabase()`

### API Endpoints

#### POST `/api/tabs/[id]/view`
Increments the view count for an approved tab.

**Request:** No body required
**Response:**
```json
{
  "success": true,
  "viewCount": 42
}
```

**Behavior:**
- Only increments for tabs with `status = 'approved'`
- Returns 404 if tab not found or not approved
- Uses `COALESCE(view_count, 0) + 1` for null safety

### Session Storage Tracking

**Key:** `harptabs_viewed_tabs`
**Value:** Array of tab IDs viewed in current session

**Example:**
```json
["tab-1234567890-abc", "tab-0987654321-xyz"]
```

**Benefits:**
- Prevents multiple counts from same user refreshing
- Persists across page navigation within session
- Clears when browser tab/window closes
- No server-side session management needed

### Client-Side Hook

**File:** `src/hooks/use-tab-view-tracking.ts`

```typescript
const { trackView, hasViewed } = useTabViewTracking();

// Track a view (returns true if newly tracked)
const tracked = await trackView(tabId);

// Check if already viewed in session
const isViewed = hasViewed(tabId);
```

### UI Integration

#### Tab Card Display
View count appears next to the date in tab cards:
- Icon: Eye icon from lucide-react
- Format: "X views" (or "1 view" singular)
- Only shown when `viewCount > 0`

#### Automatic Tracking
The `approved-tabs-display.tsx` component automatically tracks views when:
1. User clicks "View Full Tab" button
2. Tab hasn't been viewed in current session
3. API call succeeds

Local state updates immediately to reflect new count without refetching.

## Usage Example

```tsx
import { useTabViewTracking } from '@/hooks/use-tab-view-tracking';

function TabViewer({ tab }: { tab: SavedTab }) {
  const { trackView } = useTabViewTracking();
  
  const handleOpen = async () => {
    const tracked = await trackView(tab.id);
    if (tracked) {
      // Update local state if needed
      console.log('View tracked!');
    }
  };
  
  return <button onClick={handleOpen}>View Tab</button>;
}
```

## Database Migration

The `view_count` column is automatically added when `initializeDatabase()` runs:

```sql
ALTER TABLE harmonica_tabs 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0
```

Existing tabs will have `view_count = 0` by default.

## Security Considerations

1. **Session-based tracking:** Uses browser session storage (not localStorage) so counts reset when browser closes
2. **Approved tabs only:** View count only increments for tabs with `status = 'approved'`
3. **Silent failures:** Client-side tracking failures don't break UX
4. **No IP tracking:** Privacy-friendly - no server-side IP logging

## Performance

- **Database:** Single UPDATE query with WHERE clause for approved status
- **Client:** Session storage check before API call prevents unnecessary requests
- **Network:** Only tracks once per tab per session
- **UI:** Optimistic local state update prevents layout shift

## Future Enhancements

Possible improvements:
- Add "most viewed" sorting option
- Display trending tabs (high views in last 7 days)
- Admin dashboard with view analytics
- Export view count data
- IP-based tracking as fallback for users with disabled session storage
