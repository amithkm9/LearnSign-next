/**
 * Decorative floating sign emojis — ambient motion for hero sections.
 * Pure CSS animation, non-interactive (server component).
 */
const SHAPES = [
  { e: "🤟", pos: "top-[12%] left-[7%]", anim: "animate-float", delay: "0s", size: "text-4xl" },
  { e: "✋", pos: "top-[22%] right-[9%]", anim: "animate-float-slow", delay: "0.6s", size: "text-3xl" },
  { e: "👋", pos: "bottom-[20%] left-[12%]", anim: "animate-float", delay: "1.2s", size: "text-4xl" },
  { e: "🌟", pos: "top-[44%] right-[6%]", anim: "animate-float-slow", delay: "0.3s", size: "text-3xl" },
  { e: "🎉", pos: "bottom-[28%] right-[14%]", anim: "animate-float", delay: "1.8s", size: "text-4xl" },
  { e: "💜", pos: "top-[62%] left-[5%]", anim: "animate-float-slow", delay: "0.9s", size: "text-2xl" },
  { e: "👌", pos: "top-[8%] right-[28%]", anim: "animate-float", delay: "1.5s", size: "text-2xl" },
];

export function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className={`absolute ${s.pos} ${s.anim} ${s.size} opacity-80 drop-shadow-sm`}
          style={{ animationDelay: s.delay }}
        >
          {s.e}
        </span>
      ))}
    </div>
  );
}

/** Soft morphing gradient blobs — place inside a relatively-positioned hero. */
export function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-blue/30 blur-3xl animate-blob" />
      <div
        className="absolute right-0 top-10 h-80 w-80 rounded-full bg-brand-pink/25 blur-3xl animate-blob"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-yellow/25 blur-3xl animate-blob"
        style={{ animationDelay: "6s" }}
      />
    </div>
  );
}
