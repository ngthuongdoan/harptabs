# HarpTabs AI Coding Instructions

## Project Architecture

HarpTabs is a Next.js 15 App Router application for creating and managing harmonica tablature. Users interact with a visual harmonica diagram to create tabs, which enter a pending state before admin approval.

**Key architectural principles:**
- Database layer in `/lib/db.ts` using Neon serverless Postgres (`@neondatabase/serverless`)
- Harmonica business logic in `/src/lib/harmonica.ts` (never in components)
- All API routes are server-only; client components are lean
- Path aliases: `@/` maps to `src/`

## Core Data Flow

1. **Tab Creation**: User clicks holes → `harp-navigator.tsx` updates state → POST `/api/tabs` with status=`pending`
2. **Admin Review**: Admin authenticates → `/api/tabs/pending` lists pending tabs → `/api/tabs/[id]/approve` changes status to `approved`
3. **Public Display**: GET `/api/tabs` returns only approved tabs (unless `x-api-key` header present)

**Database schema** (`harmonica_tabs` table):
- `status`: `'pending' | 'approved'` (new tabs default to pending)
- `harmonica_type`: `'diatonic' | 'tremolo'` (auto-detected from hole numbers)
- `hole_history`/`note_history`: space/newline delimited strings

## Critical Patterns

### Authentication
- Simple API key auth via `x-api-key` header (see `/lib/auth.ts`)
- Client stores key in localStorage, admin state in `AdminContext` (`/src/contexts/admin-context.tsx`)
- Key in `ADMIN_API_KEY` env var (see `ADMIN_GUIDE.md` for current key)

### Harmonica Type Detection
Auto-detect from hole numbers (see `detectHarmonicaType()` in `/lib/db.ts`):
- Holes ≤10 → diatonic
- Holes >10 → tremolo

### Tab Conversion
- Diatonic notation: `+4` (blow), `-5` (draw)
- Tremolo notation: hole numbers only (1-24)
- Conversion functions in `/src/lib/harmonica.ts`: `convertDiatonicToTremolo()`, `convertTremoloToDiatonic()`

### Component State Management
`harp-navigator.tsx` demonstrates proper state handling:
- `useCallback` + `useRef` to prevent race conditions in rapid clicks
- Undo/redo stacks track `{holeHistory, noteHistory, harmonicaType}`
- `processingRef` debounces hole selection

## Development Workflow

**Commands:**
```bash
npm run dev         # Port 9002 (--turbopack enabled)
npm run typecheck   # TSC strict mode
npm run lint        # ESLint
npm run build       # Production build (NODE_ENV=production)
```

**Environment:**
- `.env.local` required (copy from `.env.example`)
- `DATABASE_URL` for Neon Postgres connection
- `ADMIN_API_KEY` for admin auth

**Database initialization:**
- GET `/api/db/init` creates tables and runs migrations
- Auto-migrates existing tabs (adds `status='approved'`, detects `harmonica_type`)

## File Organization

- **API routes**: `/src/app/api/tabs/**` - server-side handlers
- **UI components**: `/src/components/**` - client components (shadcn/ui in `/ui/`)
- **Business logic**: `/src/lib/**` - pure functions, no React
- **Contexts**: `/src/contexts/**` - global state providers
- **Docs**: `/docs/**`, root `.md` files - product documentation

## Common Tasks

**Adding a new API endpoint:**
1. Create route handler in `/src/app/api/[name]/route.ts`
2. Use `isAuthenticated(request)` for protected routes
3. Call `initializeDatabase()` before DB operations
4. Keep logic in `/lib/`, not in route handler

**Adding UI component:**
1. shadcn/ui components: `npx shadcn-ui@latest add [component]`
2. Custom components: `/src/components/[name].tsx` with `"use client"` directive
3. Use type imports: `import type { HarmonicaType } from '@/lib/harmonica'`

**Working with tabs:**
- Query `TabsDB.getAllTabs(includeAll)` - pass `true` to include pending tabs
- Create `TabsDB.createTab(title, holeHistory, noteHistory)` - auto-sets status=pending
- Approve `TabsDB.approveTab(id)` - changes status to approved

## Known Quirks

- TypeScript build errors ignored in production (`ignoreBuildErrors: true` in `next.config.ts`) - fix before deploying
- Tremolo layout assumes 24-hole C harmonica (see `TREMOLO_C_LAYOUT` in `/src/lib/harmonica.ts`)
- Admin key stored in localStorage persists across sessions
- Hole/note history stored as plain strings (not JSON) with spaces/newlines as delimiters

## References

- Admin login flow: `ADMIN_GUIDE.md`
- Database setup: `DATABASE_SETUP.md`
- Converter feature: `docs/tab-converter.md`
- Project overview: `AGENTS.md`, `README.md`
