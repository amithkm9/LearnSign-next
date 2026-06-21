import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, BarChart3, Layers } from "lucide-react";
import { getCourseById, getUserProgressForCourses } from "@/lib/data/courses";
import { CATEGORY_META, isAgeGroup } from "@/lib/data/categories";
import { getUser } from "@/lib/auth";
import { LessonPlayer } from "@/components/learn/lesson-player";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);
  return { title: course?.title ?? "Lesson" };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, user] = await Promise.all([getCourseById(id), getUser()]);
  if (!course) notFound();

  const progressMap = user
    ? await getUserProgressForCourses(user.id, [course.id])
    : {};
  const initialProgress = progressMap[course.id]?.progressPercentage ?? 0;

  const categoryTitle = isAgeGroup(course.ageGroup)
    ? CATEGORY_META[course.ageGroup].title
    : course.ageGroup;

  const objectives =
    course.learningObjectives.length > 0
      ? course.learningObjectives
      : ["Watch the demonstration", "Practice the signs", "Review and repeat"];

  return (
    <div className="container py-8">
      <Link
        href={`/courses/${course.ageGroup}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to {categoryTitle}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">
          {course.category}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
          <BarChart3 className="size-3.5" /> {course.difficulty}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
          <Clock className="size-3.5" /> {course.duration}
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight">{course.title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <LessonPlayer
            courseId={course.id}
            src={course.video}
            title={course.title}
            track={!!user}
            ageGroup={course.ageGroup}
            initialProgress={initialProgress}
          />
          {!user && (
            <p className="mt-2 text-xs text-muted-foreground">
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>{" "}
              to track your progress and streak.
            </p>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Layers className="size-4 text-primary" /> What you&apos;ll learn
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {objectives.map((o) => (
                <li key={o} className="flex gap-2">
                  <span className="text-primary">✓</span> {o}
                </li>
              ))}
            </ul>
          </div>

          {course.skills.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-semibold">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {course.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Next steps */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { href: `/courses/${course.ageGroup}`, emoji: "📚", label: "Continue Learning", sub: "More courses in this path" },
          { href: "/quiz", emoji: "✍️", label: "Practice Mode", sub: "Test your signs in the quiz" },
          { href: "/courses", emoji: "🗂️", label: "All Courses", sub: "Browse every age group" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
          >
            <div className="text-2xl">{c.emoji}</div>
            <div className="mt-2 font-semibold">{c.label}</div>
            <div className="text-sm text-muted-foreground">{c.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
