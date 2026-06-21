"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, RotateCcw, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, mediaUrl } from "@/lib/utils";

type Question = {
  target: string;
  display: string;
  video: string;
  poster: string; // landmark still — shown if the clip can't play (e.g. 1–2 frame clips)
  color: string;
};

// The recognition model knows letters a/b/c and numbers one/two/three.
const QUESTIONS: Question[] = [
  { target: "A", display: "A", video: "/assets/videos/signs/A.webm", poster: "/assets/imgs/signs/A.jpg", color: "from-brand-blue to-primary" },
  { target: "B", display: "B", video: "/assets/videos/signs/B.webm", poster: "/assets/imgs/signs/B.jpg", color: "from-brand-pink to-brand-orange" },
  { target: "C", display: "C", video: "/assets/videos/signs/C.webm", poster: "/assets/imgs/signs/C.jpg", color: "from-brand-green to-brand-blue" },
  { target: "ONE", display: "1", video: "/assets/videos/signs/1.webm", poster: "/assets/imgs/signs/1.jpg", color: "from-brand-orange to-brand-pink" },
  { target: "TWO", display: "2", video: "/assets/videos/signs/2.webm", poster: "/assets/imgs/signs/2.jpg", color: "from-primary to-brand-pink" },
  { target: "THREE", display: "3", video: "/assets/videos/signs/3.webm", poster: "/assets/imgs/signs/3.jpg", color: "from-brand-green to-brand-yellow" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PRAISE = ["Woohoo! 🎉", "Amazing! 🌟", "You got it! 🙌", "Brilliant! ✨", "High five! 🖐️", "Superstar! ⭐"];

type Phase = "intro" | "play" | "result";
type Outcome = "correct" | "wrong" | "nohand";

export function QuizPlayer() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [feedback, setFeedback] = useState<Outcome | null>(null);
  const [camError, setCamError] = useState(false);
  const [streak, setStreak] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const demoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);

  // Make sure the reference clip starts playing on each new question.
  useEffect(() => {
    if (phase === "play") demoRef.current?.play().catch(() => {});
  }, [index, phase]);

  useEffect(() => {
    if (phase !== "play") return;
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (!active) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCamError(true));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [phase]);

  function start() {
    setResults([]);
    setIndex(0);
    setFeedback(null);
    setCamError(false);
    setStreak(0);
    startedAt.current = Date.now();
    setPhase("play");
  }

  async function checkSign() {
    const video = videoRef.current;
    if (!video || detecting) return;
    setDetecting(true);
    setFeedback(null);

    const canvas = document.createElement("canvas");
    canvas.width = (video.videoWidth || 640) * 0.5;
    canvas.height = (video.videoHeight || 480) * 0.5;
    const ctx = canvas.getContext("2d")!;
    const frames: string[] = [];
    for (let i = 0; i < 20; i++) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
      await sleep(100);
    }

    const current = QUESTIONS[index];
    let outcome: Outcome = "nohand";
    try {
      const res = await fetch("/api/ml/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        const detected = (data.detected_sign || "").toUpperCase();
        if (detected === current.target) outcome = "correct";
        else if (detected && detected !== "UNKNOWN") outcome = "wrong";
      }
    } catch {
      outcome = "nohand";
    }

    setDetecting(false);
    setFeedback(outcome);
    if (outcome === "correct") {
      setStreak((s) => s + 1);
      await sleep(1700);
      advance(true);
    }
  }

  function advance(correct: boolean) {
    const next = [...results, correct];
    setFeedback(null);
    if (index < QUESTIONS.length - 1) {
      setResults(next);
      setIndex((i) => i + 1);
    } else {
      finish(next);
    }
  }

  async function finish(all: boolean[]) {
    const correct = all.filter(Boolean).length;
    const score = Math.round((correct / all.length) * 100);
    setResults(all);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: "sign-practice",
          score,
          totalQuestions: all.length,
          correct,
          timeMs: Date.now() - startedAt.current,
          answers: all.map((c, i) => ({ questionId: String(i), correct: c })),
        }),
      });
    } catch {
      /* best-effort */
    }
    setPhase("result");
  }

  if (phase === "intro") return <Intro onStart={start} />;
  if (phase === "result") return <Result results={results} onReplay={start} />;

  const current = QUESTIONS[index];
  return (
    <div className="card-base relative overflow-hidden p-5 sm:p-7">
      {/* Progress dots + streak */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-2.5 rounded-full transition-colors",
                i < results.length ? (results[i] ? "bg-brand-green" : "bg-muted-foreground/40") : i === index ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Sign {index + 1} of {QUESTIONS.length}
          {streak >= 2 && <span className="ml-2 text-brand-orange">🔥 {streak} streak!</span>}
        </span>
      </div>

      {/* Prompt: big letter badge */}
      <div className="mb-5 text-center">
        <p className="text-sm font-medium text-muted-foreground">Can you make this sign?</p>
        <motion.div
          key={current.display}
          initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className={cn(
            "mx-auto mt-2 grid size-20 place-items-center rounded-3xl bg-gradient-to-br font-display text-5xl font-bold text-white shadow-soft-lg",
            current.color,
          )}
        >
          {current.display}
        </motion.div>
      </div>

      {/* Reference (watch) + camera (copy) — narrow demo, wide camera */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-center">
        <div>
          <p className="mb-1.5 text-center text-sm font-semibold">👀 Watch the sign</p>
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-secondary ring-4 ring-brand-blue/20">
            <video
              ref={demoRef}
              key={current.video}
              src={mediaUrl(current.video)}
              poster={current.poster}
              className="h-full w-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-center text-sm font-semibold">📸 Your turn — copy it!</p>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-4 ring-brand-pink/20">
            {camError ? (
              <div className="grid h-full w-full place-items-center bg-secondary p-4 text-center text-sm text-muted-foreground">
                Camera access denied 😕
              </div>
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full -scale-x-100 object-cover"
                autoPlay
                muted
                playsInline
              />
            )}
            {detecting && (
              <div className="absolute inset-0 grid place-items-center bg-black/40">
                <motion.span
                  className="text-5xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                >
                  👀
                </motion.span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-5 w-full rounded-full text-base"
        onClick={checkSign}
        disabled={detecting || camError || feedback === "correct"}
      >
        <Camera className="size-5" /> {detecting ? "Looking…" : "Check my sign!"}
      </Button>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 grid place-items-center bg-background/85 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="text-center"
            >
              {feedback === "correct" ? (
                <>
                  <div className="relative text-7xl">
                    ✅
                    {[..."⭐🌟✨"].map((e, i) => (
                      <motion.span
                        key={i}
                        className="absolute left-1/2 top-1/2 text-2xl"
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ x: (i - 1) * 70, y: -60 - i * 10, opacity: 0 }}
                        transition={{ duration: 1.1 }}
                      >
                        {e}
                      </motion.span>
                    ))}
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold text-brand-green">
                    {PRAISE[index % PRAISE.length]}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl">{feedback === "nohand" ? "🙈" : "💪"}</div>
                  <p className="mt-3 font-display text-xl font-bold">
                    {feedback === "nohand" ? "I can't see your hands!" : "So close!"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feedback === "nohand"
                      ? "Move into the frame and try again."
                      : "Watch the example once more, then try again."}
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <Button className="rounded-full" onClick={() => setFeedback(null)}>
                      <RotateCcw className="size-4" /> Try again
                    </Button>
                    <Button variant="outline" className="rounded-full" onClick={() => advance(false)}>
                      Skip
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="card-base overflow-hidden bg-gradient-to-br from-primary/10 via-card to-brand-pink/10 p-8 text-center">
      <motion.div
        className="text-7xl"
        animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        🤟
      </motion.div>
      <h2 className="mt-4 font-display text-3xl font-bold">Let&apos;s practice signs!</h2>
      <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
        Watch the sign, then show it to the camera. I&apos;ll cheer you on! Get
        them right to collect stars. ⭐
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {QUESTIONS.map((q) => (
          <span
            key={q.display}
            className={cn(
              "grid size-10 place-items-center rounded-xl bg-gradient-to-br font-display text-lg font-bold text-white shadow-sm",
              q.color,
            )}
          >
            {q.display}
          </span>
        ))}
      </div>
      <Button size="lg" className="mt-7 rounded-full px-8 text-base" onClick={onStart}>
        Let&apos;s go! 🎉
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Needs camera access · works best with good lighting
      </p>
    </div>
  );
}

function Result({ results, onReplay }: { results: boolean[]; onReplay: () => void }) {
  const correct = results.filter(Boolean).length;
  const total = results.length;
  const score = Math.round((correct / total) * 100);
  const stars = score >= 85 ? 3 : score >= 50 ? 2 : score > 0 ? 1 : 0;
  const message =
    stars === 3 ? "Perfect signing! You're a superstar! 🌟"
    : stars === 2 ? "Great job! Keep practicing! 💪"
    : stars === 1 ? "Nice try! Let's practice some more! 🌱"
    : "Every champion starts here — try again! 💜";

  return (
    <div className="card-base bg-gradient-to-br from-primary/10 via-card to-brand-yellow/10 p-8 text-center">
      <motion.div
        className="text-7xl"
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 14 }}
      >
        {stars === 3 ? "🏆" : stars >= 1 ? "🎉" : "💜"}
      </motion.div>

      <div className="mt-4 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 260, damping: 12 }}
          >
            <Star
              className={cn("size-10", i < stars ? "fill-brand-yellow text-brand-yellow" : "text-secondary")}
            />
          </motion.div>
        ))}
      </div>

      <h2 className="mt-4 font-display text-3xl font-bold">
        You got {correct} / {total}!
      </h2>
      <p className="mt-2 text-muted-foreground">{message}</p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button size="lg" className="rounded-full px-7" onClick={onReplay}>
          <RotateCcw className="size-4" /> Play again
        </Button>
        <Button size="lg" variant="outline" className="rounded-full px-7" asChild>
          <Link href="/courses">
            More lessons <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
