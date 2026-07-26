import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  userProgress,
  profiles,
  courses,
  type ProgressRollup,
} from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/time";

export type DashboardSummary = {
  weeklyMinutes: number;
  /** [Mon..Sun] minutes for the current calendar week, in APP_TIME_ZONE. */
  weeklyActivity: number[];
  daysPracticedThisWeek: number;
  totalLearningTime: number; // minutes (all-time)
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  avgSessionMinutes: number;
  totalCompleted: number;
  coursesInProgress: number;
  totalStarted: number;
  completionPct: number;
  /** Distinct signs the learner has actually demonstrated correctly. */
  signsPracticed: number;
  avgQuiz: number;
  quizAttempts: number;
  quizPassRate: number;
  inProgress: {
    courseId: string;
    title: string | null;
    ageGroup: string | null;
    progressPercentage: number;
  }[];
};

export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const [
    progressRows,
    profileRow,
    weeklyByDay,
    weeklySessions,
    totalDays,
    totalMs,
    quiz,
    signsRow,
    inProgress,
  ] = await Promise.all([
    db
      .select({ status: userProgress.status })
      .from(userProgress)
      .where(eq(userProgress.userId, userId)),
    db
      .select({ progress: profiles.progress })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1),
    // "This week" means the current Mon–Sun calendar week in the app's
    // timezone, not a rolling 7 days in UTC — the UI labels it that way and
    // buckets it Mon-first. `date_trunc('week', ...)` is Monday-based.
    db.execute(sql`
      select extract(isodow from ts at time zone ${APP_TIME_ZONE})::int as dow,
             coalesce(sum(active_ms), 0)::bigint as ms
      from learning_events
      where user_id = ${userId}
        and ts >= date_trunc('week', now() at time zone ${APP_TIME_ZONE})
                    at time zone ${APP_TIME_ZONE}
      group by 1`),
    db.execute(sql`
      select count(*)::int as sessions from learning_events
      where user_id = ${userId} and type = 'start'
        and ts >= date_trunc('week', now() at time zone ${APP_TIME_ZONE})
                    at time zone ${APP_TIME_ZONE}`),
    db.execute(sql`
      select count(distinct (ts at time zone ${APP_TIME_ZONE})::date)::int as days
      from learning_events where user_id = ${userId}`),
    db.execute(sql`
      select coalesce(sum(active_ms), 0)::bigint as ms
      from learning_events where user_id = ${userId}`),
    db.execute(sql`
      select count(*)::int as attempts,
             coalesce(round(avg(score)), 0)::int as avg_score,
             coalesce(sum(case when passed then 1 else 0 end), 0)::int as passed
      from quiz_attempts where user_id = ${userId}`),
    // Real "signs learned": distinct questions this user has ever got right.
    db.execute(sql`
      select count(distinct a ->> 'questionId')::int as signs
      from quiz_attempts, jsonb_array_elements(answers) a
      where user_id = ${userId} and (a ->> 'correct')::boolean`),
    db
      .select({
        courseId: userProgress.courseId,
        progressPercentage: userProgress.progressPercentage,
        title: courses.title,
        ageGroup: courses.ageGroup,
      })
      .from(userProgress)
      .leftJoin(courses, eq(userProgress.courseId, courses.id))
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.status, "in_progress"),
        ),
      )
      .orderBy(desc(userProgress.lastAccessedAt))
      .limit(6),
  ]);

  // Weekly activity → Mon-first array of minutes. Postgres isodow: 1=Mon..7=Sun.
  const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
  let weeklyMs = 0;
  for (const r of weeklyByDay as unknown as { dow: number; ms: string }[]) {
    const ms = Number(r.ms);
    weeklyMs += ms;
    const idx = Number(r.dow) - 1; // Mon→0 … Sun→6
    if (idx >= 0 && idx < 7) weeklyActivity[idx] = Math.round(ms / 60000);
  }

  const progress = (profileRow[0]?.progress ?? {}) as Partial<ProgressRollup>;
  const sessions = Number((weeklySessions as unknown as { sessions: number }[])[0]?.sessions ?? 0);
  const totalDaysActive = Number((totalDays as unknown as { days: number }[])[0]?.days ?? 0);
  const totalLearningTime = Math.round(
    Number((totalMs as unknown as { ms: string }[])[0]?.ms ?? 0) / 60000,
  );
  const q = (quiz as unknown as { attempts: number; avg_score: number; passed: number }[])[0];

  const totalStarted = progressRows.length;
  const totalCompleted = progressRows.filter((p) => p.status === "completed").length;
  const coursesInProgress = progressRows.filter((p) => p.status === "in_progress").length;

  return {
    weeklyMinutes: Math.round(weeklyMs / 60000),
    weeklyActivity,
    daysPracticedThisWeek: weeklyActivity.filter((m) => m > 0).length,
    totalLearningTime,
    currentStreak: progress.currentStreak ?? 0,
    longestStreak: progress.longestStreak ?? 0,
    totalDaysActive,
    // Round to a minute only at the end — rounding the ratio buried every
    // session shorter than 30s at "0 min".
    avgSessionMinutes: sessions > 0 ? Math.round(weeklyMs / sessions / 60000) : 0,
    totalCompleted,
    coursesInProgress,
    totalStarted,
    completionPct: totalStarted ? Math.round((totalCompleted / totalStarted) * 100) : 0,
    signsPracticed: Number(
      (signsRow as unknown as { signs: number }[])[0]?.signs ?? 0,
    ),
    avgQuiz: q?.avg_score ?? 0,
    quizAttempts: q?.attempts ?? 0,
    quizPassRate: q?.attempts ? Math.round((q.passed / q.attempts) * 100) : 0,
    inProgress: inProgress.map((c) => ({
      courseId: c.courseId,
      title: c.title,
      ageGroup: c.ageGroup,
      progressPercentage: c.progressPercentage,
    })),
  };
}
