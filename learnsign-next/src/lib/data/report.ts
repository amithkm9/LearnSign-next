import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, quizAttempts, userProgress, courses } from "@/lib/db/schema";
import { getDashboardSummary } from "./analytics";

/** Gathers all parent-report DATA (no AI) — the Python service adds the narrative. */
export async function gatherReportData(userId: string) {
  const [summary, profileRow, quizzes, progress] = await Promise.all([
    getDashboardSummary(userId),
    db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),
    db
      .select({
        score: quizAttempts.score,
        submittedAt: quizAttempts.submittedAt,
        courseId: quizAttempts.courseId,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(asc(quizAttempts.submittedAt))
      .limit(20),
    db
      .select({
        courseId: userProgress.courseId,
        progressPercentage: userProgress.progressPercentage,
        status: userProgress.status,
        title: courses.title,
      })
      .from(userProgress)
      .leftJoin(courses, eq(userProgress.courseId, courses.id))
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.lastAccessedAt)),
  ]);

  const profile = profileRow[0];

  return {
    student: {
      name: profile?.name ?? "Learner",
      ageGroup: profile?.ageGroup ?? null,
      memberSince: profile?.createdAt ?? null,
      currentStreak: summary.currentStreak,
    },
    statistics: {
      totalCompleted: summary.totalCompleted,
      coursesInProgress: summary.coursesInProgress,
      completionPct: summary.completionPct,
      totalLearningTime: summary.totalLearningTime,
      weeklyMinutes: summary.weeklyMinutes,
      avgQuiz: summary.avgQuiz,
      quizAttempts: summary.quizAttempts,
      quizPassRate: summary.quizPassRate,
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
      estimatedSignsLearned: summary.estimatedSignsLearned,
      totalDaysActive: summary.totalDaysActive,
    },
    weeklyActivity: summary.weeklyActivity,
    quizTrend: quizzes.map((q, i) => ({
      attempt: i + 1,
      score: q.score ?? 0,
    })),
    courseProgress: progress.map((p) => ({
      title: p.title ?? p.courseId,
      progressPercentage: p.progressPercentage,
      status: p.status,
    })),
  };
}

export type ReportData = Awaited<ReturnType<typeof gatherReportData>>;
