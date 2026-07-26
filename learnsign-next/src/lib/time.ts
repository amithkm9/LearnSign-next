/**
 * Day boundaries for streaks.
 *
 * Streaks were keyed on `toISOString().slice(0, 10)` — i.e. UTC — so for the
 * app's Indian audience the day rolled over at 05:30 local. Practising at
 * 07:00 IST Monday and 05:00 IST Tuesday counted as one day, and a late-night
 * session silently broke a streak the learner believed was intact.
 */

/** Where "today" is decided. Override per deployment if the audience moves. */
export const APP_TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIME_ZONE || "Asia/Kolkata";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Local calendar day as "YYYY-MM-DD". en-CA already formats that way. */
export function dayKey(date: Date, timeZone = APP_TIME_ZONE): string {
  const formatter =
    timeZone === APP_TIME_ZONE
      ? dayFormatter
      : new Intl.DateTimeFormat("en-CA", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
  return formatter.format(date);
}

/** The day key one calendar day before `date`. */
export function previousDayKey(date: Date, timeZone = APP_TIME_ZONE): string {
  return dayKey(new Date(date.getTime() - 86_400_000), timeZone);
}

/**
 * Streak value after activity at `now`, given the previous state.
 * Same day → unchanged. Yesterday → +1. Anything older (or never) → restart.
 */
export function nextStreak(
  currentStreak: number,
  lastActivity: string | null | undefined,
  now: Date,
  timeZone = APP_TIME_ZONE,
): number {
  if (!lastActivity) return 1;

  const last = new Date(lastActivity);
  if (Number.isNaN(last.getTime())) return 1;

  const today = dayKey(now, timeZone);
  const lastKey = dayKey(last, timeZone);
  if (lastKey === today) return Math.max(1, currentStreak);
  if (lastKey === previousDayKey(now, timeZone)) return currentStreak + 1;
  return 1;
}
