"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Play, Pause, Gauge, Repeat, FlipHorizontal2 } from "lucide-react";
import { cn, mediaUrl } from "@/lib/utils";

export type SignLetter = { char: string; path: string };
export type SignStep = {
  word: string;
  kind?: "sign" | "fingerspell";
  path?: string;
  letters?: SignLetter[];
  matchedFrom?: string;
  breakdown?: string;
};

type Frame = {
  path: string;
  label: string;
  kind: "sign" | "letter";
  group?: string;
  matchedFrom?: string;
  breakdown?: string;
};

/** Flatten steps into playable frames; a fingerspell step becomes one frame per letter. */
function toFrames(steps: SignStep[]): Frame[] {
  const frames: Frame[] = [];
  for (const s of steps) {
    if (s.kind === "fingerspell" && s.letters?.length) {
      for (const l of s.letters) {
        frames.push({ path: l.path, label: l.char, kind: "letter", group: s.word });
      }
    } else if (s.path) {
      frames.push({
        path: s.path,
        label: s.word,
        kind: "sign",
        matchedFrom: s.matchedFrom,
        breakdown: s.breakdown,
      });
    }
  }
  return frames;
}

/**
 * Plays a sequence of sign clips word-by-word (fingerspelled words expand to
 * their letters). Built for a parent teaching a child: word chips to jump,
 * replay, pause, slow-motion, loop, and mirror mode (flip so you can face the
 * child and copy naturally).
 */
export function SignSequencePlayer({ items }: { items: SignStep[] }) {
  const frames = useMemo(() => toFrames(items), [items]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [loop, setLoop] = useState(false);
  const [mirror, setMirror] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chip per original step, mapped to the frame index where that step starts.
  const chips = useMemo(() => {
    const out: { label: string; kind: "sign" | "fingerspell"; start: number; len: number }[] = [];
    let f = 0;
    for (const s of items) {
      if (s.kind === "fingerspell" && s.letters?.length) {
        out.push({ label: s.word, kind: "fingerspell", start: f, len: s.letters.length });
        f += s.letters.length;
      } else if (s.path) {
        out.push({ label: s.word, kind: "sign", start: f, len: 1 });
        f += 1;
      }
    }
    return out;
  }, [items]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = slow ? 0.5 : 1;
    if (playing) v.play().catch(() => {});
  }, [index, playing, slow]);

  if (!frames.length) return null;
  const current = frames[index];
  const activeChip = chips.findIndex((c) => index >= c.start && index < c.start + c.len);

  function onEnded() {
    if (index < frames.length - 1) {
      setIndex((i) => i + 1);
    } else if (loop) {
      // Wrap to the start. With a single clip the index doesn't change, so the
      // play effect won't re-fire — replay the element directly.
      if (frames.length === 1) {
        const v = videoRef.current;
        if (v) {
          v.currentTime = 0;
          v.play().catch(() => {});
        }
      } else {
        setIndex(0);
        setPlaying(true);
      }
    } else {
      setPlaying(false);
    }
  }

  function toggleLoop() {
    const turningOn = !loop;
    setLoop(turningOn);
    // If the sequence already finished, kick it off again when loop is enabled.
    if (turningOn && !playing) {
      setIndex(0);
      setPlaying(true);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="relative">
        <video
          ref={videoRef}
          key={current.path}
          src={mediaUrl(current.path)}
          className="aspect-video w-full rounded-lg bg-black transition-transform"
          style={{ transform: mirror ? "scaleX(-1)" : undefined }}
          autoPlay
          muted
          playsInline
          onEnded={onEnded}
        />
        {current.kind === "letter" && (
          <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 text-xs font-semibold text-white">
            ✋ Fingerspelling {current.group} · {current.label}
          </span>
        )}
      </div>

      {/* Caption: what's being shown + why */}
      <div className="mt-2 min-h-5 text-center text-xs text-muted-foreground">
        {current.kind === "letter"
          ? `Spelling “${current.group}” — letter ${current.label}`
          : current.matchedFrom
            ? `Showing “${current.label}” (for “${current.matchedFrom}”)`
            : `Sign: ${current.label}`}
      </div>

      {current.kind === "sign" && current.breakdown && (
        <p className="mt-1 rounded-md bg-secondary/60 px-2.5 py-1.5 text-center text-xs">
          {current.breakdown}
        </p>
      )}

      {chips.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <button
              key={`${c.label}-${i}`}
              onClick={() => {
                setIndex(c.start);
                setPlaying(true);
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                i === activeChip
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent",
              )}
            >
              {c.kind === "fingerspell" ? `✋ ${c.label}` : c.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Ctrl onClick={() => { setIndex(0); setPlaying(true); }}>
          <RotateCcw className="size-3.5" /> Replay
        </Ctrl>
        <Ctrl onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? "Pause" : "Play"}
        </Ctrl>
        <Ctrl active={slow} onClick={() => setSlow((s) => !s)}>
          <Gauge className="size-3.5" /> 0.5×
        </Ctrl>
        <Ctrl active={loop} onClick={toggleLoop}>
          <Repeat className="size-3.5" /> Loop
        </Ctrl>
        <Ctrl active={mirror} onClick={() => setMirror((m) => !m)}>
          <FlipHorizontal2 className="size-3.5" /> Mirror
        </Ctrl>
        {frames.length > 1 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {index + 1} / {frames.length}
          </span>
        )}
      </div>
    </div>
  );
}

function Ctrl({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
