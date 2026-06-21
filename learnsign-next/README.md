# LearnSign — Next.js rebuild

TypeScript rebuild of the LearnSign web app. Replaces the legacy two-server
Express stack (`../index.js` + `../api.js`) and EJS/vanilla-JS frontend with a
single Next.js app. The Python sign-recognition service (`../sign_recognition/`)
is **unchanged** and reached over HTTP.

## Stack

- **Next.js 15 (App Router) + TypeScript** — frontend + API in one app
- **Tailwind CSS + shadcn/ui** — styling (lavender brand tokens ported)
- **Supabase** — Auth + Postgres (+ Storage later)
- **Drizzle ORM** — typed schema & migrations
- **TanStack Query** — client data fetching
- **Zod** — validation

## Migration phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Foundation: scaffold, Supabase + Drizzle wiring, ML bridge | ✅ this commit |
| 1 | Authentication (Supabase Auth, RLS, user migration) | next |
| 2 | App shell + marketing pages (home/about/community) | |
| 3 | Courses & packages | |
| 4 | Progress, analytics & dashboard | |
| 5 | AI Tutor + voice | |
| 6 | Parent reports + quiz | |
| 7 | Cutover & deploy (delete legacy app) | |

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase + OpenAI values
npm run dev                        # http://localhost:3000
```

### Database (Drizzle)

```bash
npm run db:generate   # create SQL migration from src/lib/db/schema.ts
npm run db:migrate    # apply migrations to Supabase Postgres
npm run db:studio     # browse data
```

> Tables are added per phase (Phase 0 has none yet).

### Python ML services

Run separately from `../sign_recognition/` (see that folder). The Next app
proxies to them via `ML_*_URL` env vars. Verify the bridge at
`GET /api/ml/recognize`.

## Structure

```
src/
  app/                 # routes (marketing, auth, app, api)
    api/ml/recognize/  # → Python :8002 bridge
  components/ui/        # shadcn components
  lib/
    db/                 # Drizzle client + schema
    supabase/           # server & browser clients
    env.ts, utils.ts
```
