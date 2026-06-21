import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Clock, Trophy, Hand, ArrowRight } from "lucide-react";
import { getProfile } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/data/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { Reveal } from "@/components/motion/reveal";

export const metadata = { title: "Dashboard" };

function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const s = await getDashboardSummary(profile.id);

  const heroStats = [
    { icon: Clock, value: s.weeklyMinutes, suffix: " min", label: "This week", sub: `${s.daysPracticedThisWeek}/7 days active`, color: "bg-brand-blue/15 text-brand-blue" },
    { icon: Flame, value: s.currentStreak, suffix: s.currentStreak === 1 ? " day" : " days", label: "Current streak", sub: `Best: ${s.longestStreak}`, color: "bg-brand-orange/15 text-brand-orange" },
    { icon: Trophy, value: s.totalCompleted, suffix: "", label: "Courses completed", sub: `${s.coursesInProgress} in progress`, color: "bg-brand-green/15 text-brand-green" },
    { icon: Hand, value: s.estimatedSignsLearned, suffix: "", label: "Signs learned", sub: "estimated", color: "bg-brand-pink/15 text-brand-pink" },
  ];

  const miniStats = [
    { label: "Total learning time", value: formatMinutes(s.totalLearningTime) },
    { label: "Days active (all time)", value: String(s.totalDaysActive) },
    { label: "Avg session", value: formatMinutes(s.avgSessionMinutes) },
    { label: "Completion rate", value: `${s.completionPct}%` },
    { label: "Avg quiz score", value: s.quizAttempts ? `${s.avgQuiz}%` : "—" },
    { label: "Quiz pass rate", value: s.quizAttempts ? `${s.quizPassRate}%` : "—" },
  ];

  return (
    <main className="container py-10">
      {/* Welcome banner */}
      <Reveal>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-brand-blue to-brand-pink bg-gradient-animated animate-gradient-x p-6 text-white shadow-lg">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {profile.name}! 👋</h1>
            <p className="text-sm text-white/85">Here&apos;s how your learning is going.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="rounded-full" asChild>
              <Link href="/report">Parent Report</Link>
            </Button>
            <Button className="rounded-full bg-white text-primary hover:bg-white/90" asChild>
              <Link href="/courses">Continue learning</Link>
            </Button>
          </div>
        </div>
      </Reveal>

      {/* Hero stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {heroStats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06}>
            <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex size-11 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="size-5" />
                </span>
                <div>
                  <div className="text-2xl font-bold leading-tight">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                  <div className="text-xs text-muted-foreground/80">{stat.sub}</div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Chart + continue learning */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle>Weekly activity</CardTitle>
            </CardHeader>
            <CardContent>
              {s.weeklyMinutes === 0 ? (
                <div className="flex h-[240px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <span className="animate-bounce-slow text-4xl">📈</span>
                  <p className="mt-2">No activity yet this week.</p>
                  <p>Watch a lesson to start your streak!</p>
                </div>
              ) : (
                <WeeklyActivityChart data={s.weeklyActivity} />
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card>
            <CardHeader>
              <CardTitle>Continue learning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {s.inProgress.length === 0 ? (
                <div className="flex flex-col items-start gap-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    🌱 Your first lesson is waiting — let&apos;s plant a streak!
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/courses">Find a course</Link>
                  </Button>
                </div>
              ) : (
                s.inProgress.map((c) => (
                  <Link
                    key={c.courseId}
                    href={`/learn/${c.courseId}`}
                    className="block rounded-xl border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.title ?? c.courseId}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.progressPercentage}%` }} />
                    </div>
                    <span className="mt-1 block text-xs text-muted-foreground">{c.progressPercentage}% complete</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      {/* Mini stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {miniStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
