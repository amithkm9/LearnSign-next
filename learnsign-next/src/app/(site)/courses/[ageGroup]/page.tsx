import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import {
  getCoursesByAgeGroup,
  getUserProgressForCourses,
} from "@/lib/data/courses";
import { getUser } from "@/lib/auth";
import { CATEGORY_META, isAgeGroup } from "@/lib/data/categories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ageGroup: string }>;
}) {
  const { ageGroup } = await params;
  if (!isAgeGroup(ageGroup)) return { title: "Courses" };
  return { title: CATEGORY_META[ageGroup].title };
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-brand-green/15 text-brand-green",
  Intermediate: "bg-brand-orange/15 text-brand-orange",
  Advanced: "bg-destructive/15 text-destructive",
};

export default async function CourseCategoryPage({
  params,
}: {
  params: Promise<{ ageGroup: string }>;
}) {
  const { ageGroup } = await params;
  if (!isAgeGroup(ageGroup)) notFound();

  const meta = CATEGORY_META[ageGroup];
  const [user, courses] = await Promise.all([
    getUser(),
    getCoursesByAgeGroup(ageGroup),
  ]);
  const progress = user
    ? await getUserProgressForCourses(user.id, courses.map((c) => c.id))
    : {};
  const completedCount = Object.values(progress).filter(
    (p) => p.status === "completed",
  ).length;

  return (
    <>
      {/* Breadcrumb + hero */}
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="container py-10">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="size-3.5" />
            <Link href="/courses" className="hover:text-primary">Courses</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{meta.title}</span>
          </nav>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-5xl">{meta.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">{meta.title}</h1>
              <p className="mt-1 text-muted-foreground">{meta.description}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {user ? (
                  <>
                    <span className="font-semibold text-primary">
                      {completedCount}/{courses.length}
                    </span>{" "}
                    completed · All free
                  </>
                ) : (
                  <>
                    {courses.length} {courses.length === 1 ? "course" : "courses"} · All free
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="container py-12">
        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No courses here yet — check back soon!
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const p = progress[course.id];
              const pct = p?.progressPercentage ?? 0;
              const done = p?.status === "completed" || pct >= 100;
              const cta = done ? "Review lesson" : p ? "Continue" : "Start lesson";

              return (
                <article
                  key={course.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        DIFFICULTY_STYLES[course.difficulty] ?? "bg-secondary"
                      }`}
                    >
                      {course.difficulty}
                    </span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-semibold text-brand-green">
                        <CheckCircle2 className="size-3.5" /> Done
                      </span>
                    ) : (
                      <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-semibold text-brand-green">
                        {course.price}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 text-lg font-semibold">{course.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    {course.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {course.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar (logged-in users with progress) */}
                  {p && (
                    <div className="mt-5">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className={done ? "font-semibold text-brand-green" : "text-muted-foreground"}>
                          {done ? "Completed 🎉" : `${pct}% watched`}
                        </span>
                        {p.timeSpent > 0 && (
                          <span className="text-muted-foreground">{p.timeSpent} min</span>
                        )}
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all ${done ? "bg-brand-green" : "bg-primary"}`}
                          style={{ width: `${Math.max(pct, done ? 100 : 4)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-4" /> {course.duration}
                    </span>
                    <Link
                      href={`/learn/${course.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2"
                    >
                      {cta} <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
