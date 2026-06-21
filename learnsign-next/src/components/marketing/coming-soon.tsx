import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Placeholder for routes that land in a later rebuild phase. */
export function ComingSoon({
  title,
  emoji,
  phase,
  description,
}: {
  title: string;
  emoji: string;
  phase: string;
  description: string;
}) {
  return (
    <section className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl">{emoji}</div>
      <span className="mt-6 inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        Coming in {phase}
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
