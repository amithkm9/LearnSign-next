"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Play, Pause, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignItem = { word: string; path: string };

/**
 * Plays a sequence of sign videos word-by-word, auto-advancing. Word chips are
 * clickable to jump; supports replay, pause, and slow-motion (0.5×).
 */
export function SignSequencePlayer({ items }: { items: SignItem[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = slow ? 0.5 : 1;
    if (playing) v.play().catch(() => {});
  }, [index, playing, slow]);

  if (!items.length) return null;
  const current = items[index];

  function onEnded() {
    if (index < items.length - 1) setIndex((i) => i + 1);
    else setPlaying(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <video
        ref={videoRef}
        key={current.path}
        src={current.path}
        className="aspect-video w-full rounded-lg bg-black"
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
      />

      {items.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <button
              key={`${it.word}-${i}`}
              onClick={() => {
                setIndex(i);
                setPlaying(true);
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                i === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent",
              )}
            >
              {it.word}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => {
            setIndex(0);
            setPlaying(true);
          }}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <RotateCcw className="size-3.5" /> Replay
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setSlow((s) => !s)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium",
            slow ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
          )}
        >
          <Gauge className="size-3.5" /> 0.5×
        </button>
        {items.length > 1 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {index + 1} / {items.length}
          </span>
        )}
      </div>
    </div>
  );
}
