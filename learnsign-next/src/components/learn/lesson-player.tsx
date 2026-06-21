"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HEARTBEAT_MS = 15_000;
const COMPLETE_THRESHOLD = 90; // % watched counts as completed (matches legacy)

type Props = {
  courseId: string;
  src: string;
  title: string;
  track: boolean;
  ageGroup: string;
  initialProgress?: number;
};

/**
 * Video player + learning-time tracker. Posts start/heartbeat/end events to
 * /api/learning/events (auth via session cookie), counting only visible-tab
 * time, and reports video progress so the course is marked complete. When the
 * video finishes it shows a celebration popup with next-step actions.
 */
export function LessonPlayer({
  courseId,
  src,
  title,
  track,
  ageGroup,
  initialProgress = 0,
}: Props) {
  const [error, setError] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [watchedPct, setWatchedPct] = useState(initialProgress);

  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionId = useRef<string>("");
  const visibleSince = useRef<number | null>(null);
  const pendingMs = useRef(0);

  function currentProgress(): number | undefined {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return undefined;
    const watched = Math.round((v.currentTime / v.duration) * 100);
    return watched >= COMPLETE_THRESHOLD ? 100 : watched;
  }

  function drainActiveMs(): number {
    let ms = pendingMs.current;
    if (visibleSince.current !== null) {
      const now = Date.now();
      ms += now - visibleSince.current;
      visibleSince.current = now;
    }
    pendingMs.current = 0;
    return ms;
  }

  function postEvent(
    type: string,
    opts: { activeMs?: number; progress?: number; beacon?: boolean } = {},
  ) {
    if (!track) return;
    const payload = {
      courseId,
      type,
      sessionId: sessionId.current,
      activeMs: opts.activeMs ?? 0,
      progressPercentage: opts.progress ?? currentProgress(),
    };
    const url = "/api/learning/events";
    if (opts.beacon && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }

  useEffect(() => {
    if (!track) return;
    sessionId.current =
      globalThis.crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    visibleSince.current = document.visibilityState === "visible" ? Date.now() : null;

    postEvent("start");
    const interval = setInterval(
      () => postEvent("heartbeat", { activeMs: drainActiveMs() }),
      HEARTBEAT_MS,
    );

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        if (visibleSince.current !== null) {
          pendingMs.current += Date.now() - visibleSince.current;
          visibleSince.current = null;
        }
        postEvent("pause", { activeMs: drainActiveMs(), beacon: true });
      } else {
        visibleSince.current = Date.now();
        postEvent("resume");
      }
    }
    const onHide = () => postEvent("end", { activeMs: drainActiveMs(), beacon: true });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      postEvent("end", { activeMs: drainActiveMs(), beacon: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, track]);

  function handleEnded() {
    postEvent("heartbeat", { activeMs: drainActiveMs(), progress: 100 });
    setCompleted(true);
  }

  function watchAgain() {
    setCompleted(false);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (v?.duration) {
      setWatchedPct(Math.min(100, Math.round((v.currentTime / v.duration) * 100)));
    }
  }

  function handleLoadedMetadata() {
    const v = videoRef.current;
    // Resume where the learner left off (unless basically finished).
    if (v && initialProgress > 5 && initialProgress < 95) {
      v.currentTime = (initialProgress / 100) * v.duration;
    }
  }

  if (error) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 text-center">
        <span className="text-4xl">🎬</span>
        <p className="font-medium">Video coming soon</p>
        <p className="text-sm text-muted-foreground">This lesson&apos;s video is being produced.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          title={title}
          controls
          controlsList="nodownload"
          className="aspect-video w-full rounded-xl bg-black"
          onError={() => setError(true)}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {/* Completion celebration popup */}
        {completed && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-soft-lg">
            <div className="animate-bounce-slow text-5xl">🎉</div>
            <h3 className="mt-3 font-display text-xl font-bold">Lesson complete!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Awesome work — ready to test what you learned?
            </p>
            <div className="mt-5 grid gap-2">
              <Button asChild className="rounded-full">
                <Link href="/quiz">✍️ Take the quiz</Link>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-full" onClick={watchAgain}>
                  <RotateCcw className="size-4" /> Watch again
                </Button>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href={`/courses/${ageGroup}`}>
                    More <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Watch progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className={watchedPct >= 90 ? "font-semibold text-brand-green" : "text-muted-foreground"}>
            {watchedPct >= 90 ? "✓ Completed" : `${watchedPct}% watched`}
          </span>
          {!track && (
            <span className="text-muted-foreground">Sign in to save your progress</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all ${watchedPct >= 90 ? "bg-brand-green" : "bg-primary"}`}
            style={{ width: `${watchedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
