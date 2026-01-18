# AGENTS

## Project overview
HarpTabs is a Next.js App Router app for creating, saving, and reviewing harmonica tablature. Users create tabs from an interactive harmonica diagram. New tabs are saved as pending and require admin approval before they show publicly. There is also a tab converter for diatonic and tremolo harmonicas and a pitch detector feature.

## Stack
- Next.js App Router with React and TypeScript
- Tailwind CSS + shadcn/ui components
- Vercel Postgres via serverless Neon driver

## Key paths
- `src/app`: routes and API handlers
- `src/components`: UI and feature components (harp navigator, converters, admin UI)
- `src/lib`: data access, harmonica logic, and helpers
- `docs/` and `README.md`: product and feature notes

## Data model and storage
- Database access lives in `lib/db.ts` and uses `DATABASE_URL`.
- Primary table: `harmonica_tabs` with fields for title, hole history, note history, harmonica type, status, and timestamps.
- New tabs default to `pending`; admins approve to make them public.

## API routes
- `src/app/api/tabs`: list and create tabs
- `src/app/api/tabs/[id]`: get, update, delete tab
- `src/app/api/tabs/[id]/approve`: approve a pending tab
- `src/app/api/tabs/pending`: list pending tabs (admin)
- `src/app/api/db/init`: initialize database tables

## Admin flow
- Admin login uses an API key stored in localStorage and sent via `x-api-key` header.
- See `ADMIN_GUIDE.md` for the current key and usage details.

## Local dev commands
- `npm run dev` (Next dev server on port 9002)
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Environment
- Create `.env.local` from `.env.example`.
- Ensure `DATABASE_URL` is set for local database access.

## Notes for contributors
- Keep harmonica conversion logic in `src/lib/harmonica.ts` and UI wiring in `src/components`.
- Pending/approved behavior is enforced in the API handlers and `TabsDB` queries.
- When adding new API routes, prefer server-only logic in route handlers and keep client components lean.
