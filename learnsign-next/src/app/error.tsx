"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Keeps a server or render failure from showing a
 * child Next's raw stack page, and gives them a way back.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest correlates with the server log; the message itself is not shown.
    console.error("route error:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="container grid min-h-[60vh] place-items-center py-16">
      <div className="max-w-md text-center">
        <div className="text-6xl">🙈</div>
        <h1 className="mt-4 font-display text-2xl font-bold">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That&apos;s on us, not you. Try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button className="rounded-full" onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
