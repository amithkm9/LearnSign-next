import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  profiles,
  userProgress,
  quizAttempts,
  learningEvents,
  courses,
  type ProgressRollup,
} from "@/lib/db/schema";

/**
 * Personalisation context for the AI tutor. Gathered from the DB here (the
 * gateway side) and passed to the stateless Python AI service per request.
 */
export type TutorProfile = {
  userName: string;
  ageGroup: string;
  accountAge: number;
  totalCourses: number;
  coursesCompleted: number;
  progressPercentage: number;
  totalMinutes: number;
  recentQuizScores: string;
  avgQuizScore: number;
  currentStreak: number;
  lastActive: string;
  weakAreas: string;
  strongAreas: string;
  language: string;
  learningStyle: string;
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 7)} week(s) ago`;
}

function determineLearningStyle(
  events: { activeMs: number }[],
  quizCount: number,
): string {
  if (!events.length) return "Visual learner (default)";
  const avgSession =
    events.reduce((sum, e) => sum + (e.activeMs || 0), 0) / events.length / 60000;
  if (avgSession > 30 && quizCount > 5) return "Deep learner - prefers thorough understanding";
  if (avgSession < 10 && quizCount > 3) return "Quick learner - short bursts with frequent testing";
  if (avgSession > 20) return "Focused learner - enjoys longer study sessions";
  return "Visual learner - benefits from video demonstrations";
}

/** Build the personalised tutor profile from the user's real data. */
export async function getUserTutorProfile(userId: string): Promise<TutorProfile | null> {
  const [profileRow, progressRows, quizzes, recentEvents] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),
    db.select().from(userProgress).where(eq(userProgress.userId, userId)),
    db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.submittedAt))
      .limit(10),
    db
      .select({ activeMs: learningEvents.activeMs })
      .from(learningEvents)
      .where(eq(learningEvents.userId, userId))
      .orderBy(desc(learningEvents.ts))
      .limit(20),
  ]);

  const user = profileRow[0];
  if (!user) return null;
  const progress = user.progress as ProgressRollup;

  const totalCourses = progressRows.length;
  const coursesCompleted = progressRows.filter((p) => p.status === "completed").length;
  const avgProgress = totalCourses
    ? Math.round(progressRows.reduce((s, p) => s + p.progressPercentage, 0) / totalCourses)
    : 0;
  // Sum in ms then convert — `timeSpent` is a rounded-down derived column, so
  // summing it loses up to a minute per course.
  const totalMinutes = Math.floor(
    progressRows.reduce((s, p) => s + (p.timeSpentMs || 0), 0) / 60_000,
  );

  const recentQuizScores =
    quizzes.slice(0, 5).map((q) => `${q.score}%`).join(", ") || "No quizzes taken yet";
  const avgQuizScore = quizzes.length
    ? Math.round(quizzes.reduce((s, q) => s + (q.score || 0), 0) / quizzes.length)
    : 0;

  // Weak / strong areas by per-course quiz performance.
  const perCourse: Record<string, number[]> = {};
  for (const q of quizzes) {
    (perCourse[q.courseId] ??= []).push(q.score || 0);
  }

  // Resolve to human course titles — these are read aloud by the tutor and
  // shown to parents, where a bare "001, 004" means nothing.
  const courseIds = Object.keys(perCourse);
  const titles = courseIds.length
    ? Object.fromEntries(
        (
          await db
            .select({ id: courses.id, title: courses.title })
            .from(courses)
            .where(inArray(courses.id, courseIds))
        ).map((c) => [c.id, c.title]),
      )
    : {};
  const label = (courseId: string) =>
    titles[courseId] ?? (courseId === "practice" ? "Sign practice" : courseId);

  const weak: string[] = [];
  const strong: string[] = [];
  for (const [courseId, scores] of Object.entries(perCourse)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 70) weak.push(label(courseId));
    else if (avg >= 85) strong.push(label(courseId));
  }

  return {
    userName: user.name || "Learner",
    ageGroup: user.ageGroup || "15+",
    accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000),
    totalCourses,
    coursesCompleted,
    progressPercentage: avgProgress,
    totalMinutes,
    recentQuizScores,
    avgQuizScore,
    currentStreak: progress?.currentStreak ?? 0,
    lastActive: progress?.lastActivityDate
      ? formatTimeAgo(new Date(progress.lastActivityDate))
      : "Never",
    weakAreas: weak.length ? weak.join(", ") : "None identified yet",
    strongAreas: strong.length ? strong.join(", ") : "Keep learning to find your strengths!",
    language: user.preferences?.language || "en",
    learningStyle: determineLearningStyle(recentEvents, quizzes.length),
  };
}
