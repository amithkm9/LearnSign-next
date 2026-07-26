-- ============================================================================
-- Hardening — restrict which profile columns a user may edit.
--
-- The RLS policy from 0001 is row-scoped (auth.uid() = id) but not COLUMN
-- scoped, so anyone holding the anon key could update their own row's
-- `subscription` jsonb and grant themselves a paid plan, or rewrite `progress`
-- to fake streaks and learning time in the parent report.
--
-- Postgres column-level grants are the right tool: RLS decides WHICH ROWS,
-- grants decide WHICH COLUMNS. The app's own writes go through the postgres
-- role and are unaffected.
--
-- Run after 0001_profiles_rls_trigger.sql.
-- ============================================================================

-- Blanket UPDATE is replaced by an explicit per-column list.
revoke update on public.profiles from authenticated;

grant update (name, phone, user_type, age_group, preferences)
  on public.profiles to authenticated;

-- `id`, `subscription`, `progress`, `created_at` and `updated_at` are
-- deliberately absent: they are set by the signup trigger, by billing, or by
-- the server-side gateway, never by the client.

-- SELECT stays as-is (own row only, per the 0001 policy).
grant select on public.profiles to authenticated;
