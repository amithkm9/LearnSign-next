-- ============================================================================
-- Bugfix — learning time was always recorded as 0.
--
-- The events route accumulated `round(activeMs / 60000)` minutes, but the
-- player heartbeats every 15s, so every increment rounded to 0 and
-- user_progress.time_spent / profiles.progress.totalLearningTime never moved.
--
-- Milliseconds become the source of truth; the existing minute columns are
-- kept and derived from them so nothing that reads them breaks.
--
-- Run after 0003_progress_rls.sql.
-- ============================================================================

-- 1. Millisecond column, backfilled from the minutes recorded so far ---------
alter table public.user_progress
  add column if not exists time_spent_ms bigint not null default 0;

update public.user_progress
  set time_spent_ms = time_spent::bigint * 60000
  where time_spent_ms = 0 and time_spent > 0;

-- 2. Same for the profile rollup jsonb ---------------------------------------
update public.profiles
  set progress = jsonb_set(
    progress,
    '{totalLearningTimeMs}',
    to_jsonb(coalesce((progress ->> 'totalLearningTime')::bigint, 0) * 60000)
  )
  where progress -> 'totalLearningTimeMs' is null;

-- 3. Recover the time that was silently dropped -------------------------------
-- learning_events kept the raw active_ms all along, so the real totals can be
-- rebuilt from it. Only raises values, never lowers them.
update public.user_progress up
  set time_spent_ms = greatest(up.time_spent_ms, ev.total_ms),
      time_spent    = greatest(up.time_spent, (ev.total_ms / 60000)::int)
  from (
    select user_id, course_id, coalesce(sum(active_ms), 0)::bigint as total_ms
    from public.learning_events
    group by user_id, course_id
  ) ev
  where up.user_id = ev.user_id and up.course_id = ev.course_id;

update public.profiles p
  set progress = jsonb_set(
    jsonb_set(
      p.progress,
      '{totalLearningTimeMs}',
      to_jsonb(greatest(coalesce((p.progress ->> 'totalLearningTimeMs')::bigint, 0), ev.total_ms))
    ),
    '{totalLearningTime}',
    to_jsonb(greatest(coalesce((p.progress ->> 'totalLearningTime')::bigint, 0), ev.total_ms / 60000))
  )
  from (
    select user_id, coalesce(sum(active_ms), 0)::bigint as total_ms
    from public.learning_events
    group by user_id
  ) ev
  where p.id = ev.user_id;
