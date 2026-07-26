import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="container grid min-h-[60vh] place-items-center py-16">
      <div className="max-w-md text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 font-display text-2xl font-bold">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be old, or the lesson may have moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button className="rounded-full" asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
