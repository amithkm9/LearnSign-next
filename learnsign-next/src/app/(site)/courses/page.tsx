import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategoryCounts } from "@/lib/data/courses";
import { AGE_GROUPS, CATEGORY_META } from "@/lib/data/categories";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";

export const metadata = {
  title: "Courses",
  description: "Free Indian Sign Language courses for every age group.",
};

const WHAT_YOU_LEARN: Record<string, string[]> = {
  "1-4": ["Basic gestures", "Simple words", "Numbers 1–10"],
  "5-10": ["Alphabet & spelling", "Family & school signs", "Short conversations"],
  "15+": ["Emotions & expressions", "Complex grammar", "Fluent conversation"],
};

const TINTS: Record<string, string> = {
  "1-4": "from-brand-pink/15 to-brand-yellow/15",
  "5-10": "from-primary/15 to-brand-blue/15",
  "15+": "from-brand-green/15 to-brand-blue/15",
};

export default async function CoursesPage() {
  const counts = await getCategoryCounts();

  return (
    <>
      <section className="relative overflow-hidden bg-dots">
        <div className="container relative py-16 text-center sm:py-20">
          <Reveal>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              📚 Course <span className="text-gradient">Catalog</span>
            </h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Every course is <span className="font-semibold text-primary">100% free</span>.
              Pick a learning path by age and start signing today!
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container pb-20">
        <RevealStagger className="grid gap-6 md:grid-cols-3">
          {AGE_GROUPS.map((ag) => {
            const meta = CATEGORY_META[ag];
            const count = counts[ag] ?? 0;
            return (
              <RevealItem key={ag}>
                <Link
                  href={`/courses/${ag}`}
                  className={`group flex h-full flex-col rounded-3xl border border-border bg-gradient-to-br p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg ${TINTS[ag]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{meta.emoji}</span>
                    <span className="text-sm">{meta.difficulty}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{meta.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{meta.description}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {WHAT_YOU_LEARN[ag].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="text-primary">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="text-sm text-muted-foreground">
                      {count} {count === 1 ? "course" : "courses"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
                      Start Learning <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealStagger>
      </section>
    </>
  );
}
