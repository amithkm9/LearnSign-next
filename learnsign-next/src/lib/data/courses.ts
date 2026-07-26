import { cache } from "react";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, userProgress } from "@/lib/db/schema";

export type CourseProgress = {
  progressPercentage: number;
  status: string;
  timeSpent: number;
};

/** The user's progress for a set of courses, keyed by courseId. */
export async function getUserProgressForCourses(
  userId: string,
  courseIds: string[],
): Promise<Record<string, CourseProgress>> {
  if (courseIds.length === 0) return {};
  const rows = await db
    .select({
      courseId: userProgress.courseId,
      progressPercentage: userProgress.progressPercentage,
      status: userProgress.status,
      timeSpent: userProgress.timeSpent,
    })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        inArray(userProgress.courseId, courseIds),
      ),
    );
  return Object.fromEntries(
    rows.map((r) => [
      r.courseId,
      { progressPercentage: r.progressPercentage, status: r.status, timeSpent: r.timeSpent },
    ]),
  );
}

/** Courses in one age group, ordered by difficulty then id. */
export async function getCoursesByAgeGroup(ageGroup: string) {
  return db
    .select()
    .from(courses)
    .where(and(eq(courses.ageGroup, ageGroup), eq(courses.isPublished, true)))
    .orderBy(asc(courses.durationMinutes), asc(courses.id));
}

/** A single course by its legacy id ("001"). */
export async function getCourseById(id: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  return course ?? null;
}

/**
 * Whether a course id is real. Used to reject junk courseIds before they create
 * orphan progress/event rows (course_id has no FK to courses). Cached per
 * request so repeated heartbeats for one course cost a single query.
 */
export const courseExists = cache(async (id: string): Promise<boolean> => {
  if (!id || id.length > 64) return false;
  const [row] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  return Boolean(row);
});

/** Published course count per age group, e.g. { "1-4": 3, "5-10": 3, "15+": 2 }. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      ageGroup: courses.ageGroup,
      count: sql<number>`count(*)::int`,
    })
    .from(courses)
    .where(eq(courses.isPublished, true))
    .groupBy(courses.ageGroup);

  return Object.fromEntries(rows.map((r) => [r.ageGroup, r.count]));
}
