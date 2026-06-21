-- ============================================================================
-- Phase 3 — RLS for courses & packages (public, read-only catalog data).
-- Run after `npm run db:migrate` adds the tables. The app reads these
-- server-side via the postgres role (bypasses RLS); the public SELECT policy
-- is defence-in-depth and silences Supabase's "RLS disabled" warning.
-- ============================================================================

alter table public.courses enable row level security;
drop policy if exists "Courses are publicly readable" on public.courses;
create policy "Courses are publicly readable"
  on public.courses for select using (true);

alter table public.packages enable row level security;
drop policy if exists "Packages are publicly readable" on public.packages;
create policy "Packages are publicly readable"
  on public.packages for select using (true);
