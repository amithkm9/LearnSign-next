import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";
import { FloatingShapes } from "@/components/motion/floating-shapes";

export const metadata = {
  title: "About",
  description:
    "LearnSign's mission: making Indian Sign Language learning accessible, joyful, and effective for every family.",
};

// Honest, verifiable numbers (no inflated marketing stats).
const STATS = [
  { number: "350+", label: "Signs in our library" },
  { number: "4", label: "Languages supported" },
  { number: "3", label: "Age-based paths" },
  { number: "100%", label: "Free to learn" },
];

const MISSION = [
  {
    icon: "📚",
    title: "Comprehensive & bite-size",
    text: "Short, structured lessons with instant webcam feedback — and a path that quietly adapts to each learner.",
    color: "bg-brand-blue/15 text-brand-blue",
  },
  {
    icon: "🌍",
    title: "Accessible to all",
    text: "Free forever, works on any device, and designed with the Deaf and hard-of-hearing community in mind.",
    color: "bg-brand-green/15 text-brand-green",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family-centered",
    text: "Built for grown-ups and kids to learn side by side — because language grows fastest when it's shared.",
    color: "bg-brand-pink/15 text-brand-pink",
  },
];

const LEAD = {
  img: "/assets/imgs/amith.jpg",
  name: "Amith Reddy",
  role: "Project Lead & Developer",
  bio: "Drives the vision and engineering behind LearnSign — pairing a love of clean, accessible technology with the belief that every child deserves the joy of being understood.",
  specialties: ["Project Leadership", "System Architecture", "Accessibility"],
};

const TEAM = [
  { img: "/assets/imgs/adarsh.jpg", name: "Adarsh K R", role: "Full Stack Developer", bio: "Builds the robust frontend and backend that keep lessons smooth and seamless.", skills: ["Frontend", "Backend"], accent: "ring-brand-blue/30" },
  { img: "/assets/imgs/chandana.png", name: "Chandana N M", role: "Research & Development", bio: "Explores accessibility tech and the best ways to teach sign language.", skills: ["Research", "Accessibility"], accent: "ring-brand-pink/30" },
  { img: "/assets/imgs/prajwal.jpg", name: "Prajwal K", role: "Backend Engineer", bio: "Crafts the scalable services powering lessons, sign recognition, and the AI tutor.", skills: ["Backend", "Scalability"], accent: "ring-brand-green/30" },
];

const VALUES = [
  { icon: "🌟", title: "Excellence", text: "We sweat the small stuff — every word, animation, and lesson.", color: "text-brand-yellow" },
  { icon: "🤝", title: "Inclusivity", text: "Built with and for the Deaf community, so everyone belongs.", color: "text-brand-blue" },
  { icon: "📚", title: "Education", text: "Learning that's genuinely effective — and genuinely fun.", color: "text-brand-green" },
  { icon: "💝", title: "Empathy", text: "We listen first, then design for real needs with care.", color: "text-brand-pink" },
];

export default function AboutPage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-dots">
        <FloatingShapes />
        <div className="container relative py-20 text-center sm:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              ✨ About LearnSign
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold sm:text-5xl">
              <span className="text-gradient">Every child deserves</span>
              <span className="mt-2 block">to be understood.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              LearnSign is a small team on a big mission: to make learning Indian
              Sign Language the warmest, most accessible, most joyful it can be —
              for kids, parents, and teachers alike.
            </p>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={0.1 + i * 0.08}>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur">
                  <div className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.number}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Mission ===== */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">🎯 Our mission</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Sign language learning, made for everyone
            </h2>
            <p className="mt-3 text-muted-foreground">
              LearnSign began with a simple belief — that communication is a right,
              not a privilege. So we&apos;re building a place where learning to
              sign feels less like a lesson and more like play.
            </p>
          </Reveal>
          <RevealStagger className="grid gap-6 md:grid-cols-3">
            {MISSION.map((m) => (
              <RevealItem key={m.title}>
                <div className="group card-base card-interactive h-full p-6">
                  <div className={`flex size-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110 ${m.color}`}>
                    {m.icon}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ===== Team ===== */}
      <section className="bg-secondary/30 py-16 sm:py-20">
        <div className="container">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">👥 Our team</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">The people behind LearnSign</h2>
            <p className="mt-3 text-muted-foreground">
              A small, passionate student team — developers, researchers, and
              accessibility advocates building this together.
            </p>
          </Reveal>

          {/* Team lead */}
          <Reveal className="mx-auto mb-8 max-w-4xl">
            <div className="card-base relative overflow-hidden p-6 transition-shadow hover:shadow-soft-lg sm:flex sm:items-center sm:gap-8 sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LEAD.img}
                alt={LEAD.name}
                className="relative mx-auto size-44 shrink-0 rounded-[1.75rem] object-cover shadow-soft ring-4 ring-primary/20 sm:mx-0"
              />
              <div className="relative mt-6 text-center sm:mt-0 sm:text-left">
                <span className="chip mb-3 bg-primary text-primary-foreground">⭐ Team Lead</span>
                <h3 className="font-display text-2xl font-bold">{LEAD.name}</h3>
                <p className="text-sm font-medium text-primary">{LEAD.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{LEAD.bio}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {LEAD.specialties.map((s) => (
                    <span key={s} className="chip bg-primary/10 text-primary">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((m) => (
              <RevealItem key={m.name}>
                <div className="card-base card-interactive h-full p-6 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.img} alt={m.name} className={`mx-auto size-28 rounded-full object-cover ring-4 ${m.accent}`} />
                  <h3 className="mt-4 font-display font-semibold">{m.name}</h3>
                  <p className="text-sm text-primary">{m.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {m.skills.map((s) => (
                      <span key={s} className="chip bg-secondary text-secondary-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ===== Values ===== */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">💎 Our values</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">What drives us forward</h2>
          </Reveal>
          <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <RevealItem key={v.title}>
                <div className="card-base card-interactive h-full p-6 text-center">
                  <div className={`text-4xl ${v.color}`}>{v.icon}</div>
                  <h3 className="mt-3 font-display font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="container pb-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-brand-blue to-brand-pink bg-gradient-animated animate-gradient-x px-6 py-14 text-center text-white shadow-soft-lg">
            <h2 className="text-3xl font-bold">Learn with us</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Join the families breaking down communication barriers — one joyful sign at a time.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="secondary" className="rounded-full px-7" asChild>
                <Link href="/register">🚀 Start learning free</Link>
              </Button>
              <Button size="lg" variant="link" className="text-white" asChild>
                <Link href="/community">Read inspiring stories →</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
