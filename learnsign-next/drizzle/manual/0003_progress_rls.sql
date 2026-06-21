-- ============================================================================
-- Phase 4 — FKs + owner-only RLS for progress/event/quiz tables.
-- Run after `npm run db:migrate` adds the tables.
-- The app writes these via the postgres role (bypasses RLS); the owner-only
-- policies are the real authorization boundary for any client-side access.
-- ============================================================================

-- Foreign keys to auth.users -------------------------------------------------
alter table public.user_progress drop constraint if exists user_progress_user_fk;
alter table public.user_progress
  add constraint user_progress_user_fk
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.learning_events drop constraint if exists learning_events_user_fk;
alter table public.learning_events
  add constraint learning_events_user_fk
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.quiz_attempts drop constraint if exists quiz_attempts_user_fk;
alter table public.quiz_attempts
  add constraint quiz_attempts_user_fk
  foreign key (user_id) references auth.users (id) on delete cascade;

-- Row Level Security (owner-only, all commands) ------------------------------
alter table public.user_progress enable row level security;
drop policy if exists "Users manage own progress" on public.user_progress;
create policy "Users manage own progress"
  on public.user_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.learning_events enable row level security;
drop policy if exists "Users manage own events" on public.learning_events;
create policy "Users manage own events"
  on public.learning_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.quiz_attempts enable row level security;
drop policy if exists "Users manage own quiz attempts" on public.quiz_attempts;
create policy "Users manage own quiz attempts"
  on public.quiz_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep user_progress.updated_at fresh (reuses set_updated_at from 0001) -------
drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();
