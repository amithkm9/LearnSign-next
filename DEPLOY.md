# Deployment runbook (free stack)

**Stack:** Web → **Vercel** · AI service → **Hugging Face Spaces** (Docker) · DB/Auth/Storage → **Supabase** · OpenAI → your key.

Generate one shared secret first and reuse it everywhere it says `<INTERNAL_API_TOKEN>`:

```bash
openssl rand -hex 32
```

---

## Phase 2 — Supabase (database + video storage)

From `learnsign-next/` (with `.env.local` filled in — use the **Transaction pooler** URL, port 6543, `?sslmode=require`):

```bash
# 1. Tables + RLS/triggers (order matters)
npm run db:migrate
node scripts/apply-sql.mjs drizzle/manual/0001_profiles_rls_trigger.sql
node scripts/apply-sql.mjs drizzle/manual/0002_courses_packages_rls.sql
node scripts/apply-sql.mjs drizzle/manual/0003_progress_rls.sql
node scripts/apply-sql.mjs drizzle/manual/0004_oauth_profile.sql

# 2. Seed the catalog
node scripts/seed.mjs

# 3. Upload the ~340 MB of videos to Supabase Storage (creates a public "media" bucket)
node --env-file=.env.local scripts/upload-media.mjs

# 4. Sanity check the DB
node scripts/verify-db.mjs
```

The upload script prints the value for `NEXT_PUBLIC_MEDIA_BASE_URL` — save it.

---

## Phase 3 — AI service → Hugging Face Space

1. Create a **new Space** → SDK **Docker** (CPU basic, free).
2. Add this front-matter to the **top of the Space's `README.md`** (so it serves on port 8100):

   ```yaml
   ---
   title: LearnSign AI
   emoji: 🤟
   colorFrom: purple
   colorTo: pink
   sdk: docker
   app_port: 8100
   ---
   ```

3. Push the **contents of `ai-service/`** (Dockerfile, `app/`, `requirements.txt`) to the Space repo:

   ```bash
   git clone https://huggingface.co/spaces/<you>/<space> hf-space
   cp -r ai-service/* hf-space/        # add the README front-matter above
   cd hf-space && git add . && git commit -m "deploy ai-service" && git push
   ```

4. In the Space → **Settings → Variables and secrets**, add:
   - `OPENAI_API_KEY` = your key
   - `INTERNAL_API_TOKEN` = `<INTERNAL_API_TOKEN>`
5. Wait for the build, then check `https://<you>-<space>.hf.space/health` → `{"openai": true}`. Note this base URL.

---

## Phase 4 — Web → Vercel

1. **Import** the GitHub repo → set **Root Directory = `learnsign-next`**.
2. **Environment variables:**

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service-role key |
   | `DATABASE_URL` | pooler URL (`:6543`, `?sslmode=require`) |
   | `AI_SERVICE_URL` | the HF Space base URL (from Phase 3) |
   | `INTERNAL_API_TOKEN` | `<INTERNAL_API_TOKEN>` |
   | `NEXT_PUBLIC_MEDIA_BASE_URL` | from Phase 2 (e.g. `https://<proj>.supabase.co/storage/v1/object/public/media`) |
   | `OPENAI_API_KEY` | your key (only if Next calls OpenAI directly; optional) |

3. **Deploy** → note the `https://<app>.vercel.app` URL.

---

## Phase 5 — Auth wiring (Supabase)

In Supabase → **Authentication → URL Configuration**:
- **Site URL** = `https://<app>.vercel.app`
- **Redirect URLs** → add `https://<app>.vercel.app/auth/callback`

For **Google login**: Auth → Providers → Google (enable + add your Google OAuth client), and add the same callback URL.

---

## Phase 6 — Verify

- Visit the Vercel URL → sign up → confirm email → log in.
- Courses play (videos load from Storage), AI Tutor answers, Quiz recognises a sign, Dashboard shows stats, Parent report renders.
- First hit after idle may take ~30–60s while the HF Space wakes — then it's warm.

---

## Notes
- The AI service rejects any request without the `X-Internal-Token` header once `INTERNAL_API_TOKEN` is set, so only the Vercel gateway can use it.
- Per-user rate limits protect your OpenAI spend (tutor 30/min, voice 10/min, TTS 20/min, report 10/min).
- Local dev is unchanged: leave `INTERNAL_API_TOKEN` and `NEXT_PUBLIC_MEDIA_BASE_URL` empty.
