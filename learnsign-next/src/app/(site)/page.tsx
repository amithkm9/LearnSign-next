import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { FloatingShapes, GradientBlobs } from "@/components/motion/floating-shapes";

const STATS = [
  { value: 1000, suffix: "+", label: "Happy families" },
  { value: 50, suffix: "+", label: "Bite-size lessons" },
  { value: 350, suffix: "+", label: "Signs to discover" },
];

const SIGN_CHIPS = ["👋 Hello", "🙏 Thank you", "❤️ I love you", "👨‍👩‍👧 Family", "⭐ Friend"];

const FEATURES = [
  {
    icon: "🤖",
    title: "A tutor with endless patience",
    description:
      "Our friendly AI watches each sign, cheers the wins, and gently nudges the tricky ones — always at your child's pace.",
    highlight: "Instant feedback",
    color: "bg-brand-blue/15 text-brand-blue",
  },
  {
    icon: "🎮",
    title: "Practice that feels like play",
    description:
      "Webcam challenges, mini-games, and little rewards turn “time to practice” into “can we do one more?”",
    highlight: "Games & rewards",
    color: "bg-brand-pink/15 text-brand-pink",
  },
  {
    icon: "📊",
    title: "Progress the whole family sees",
    description:
      "Streaks, badges, and a warm parent report so everyone can celebrate just how far they've come.",
    highlight: "Parent reports",
    color: "bg-brand-green/15 text-brand-green",
  },
];

const AGE_GROUPS = [
  {
    emoji: "👶",
    title: "Early Learners",
    range: "Ages 3–4",
    description: "Big, bouncy gestures, songs, and peekaboo signs — the gentlest first hellos.",
    features: ["🖐️ Simple hand shapes", "🎯 Playful games", "👨‍👩‍👧 Grown-up-and-me time"],
    href: "/courses/1-4",
    tint: "from-brand-pink/15 to-brand-yellow/15",
    accent: "text-brand-pink",
    featured: false,
  },
  {
    emoji: "🧒",
    title: "Young Explorers",
    range: "Ages 5–10",
    description: "Real words, short conversations, and story adventures that bring signing to life.",
    features: ["📚 Growing vocabulary", "💬 Everyday chats", "📖 Story adventures"],
    href: "/courses/5-10",
    tint: "from-primary/15 to-brand-blue/15",
    accent: "text-primary",
    featured: true,
  },
  {
    emoji: "🎓",
    title: "Advanced Learners",
    range: "Ages 15+",
    description: "Nuanced grammar, everyday fluency, and the rich culture behind every sign.",
    features: ["🧠 Deeper grammar", "🌍 Deaf culture", "🎭 Real-world practice"],
    href: "/courses/15+",
    tint: "from-brand-green/15 to-brand-blue/15",
    accent: "text-brand-green",
    featured: false,
  },
];

const TESTIMONIALS = [
  { text: "LearnSign turned practice into playtime. My son now asks to do his signs before bed!", avatar: "👩‍👦", name: "Sarah Johnson", role: "Parent of a 7-year-old", tint: "bg-brand-pink/10" },
  { text: "The structure and instant feedback are brilliant. My whole class is hooked on it.", avatar: "👨‍🏫", name: "Michael Chen", role: "Special Education Teacher", tint: "bg-brand-blue/10" },
  { text: "The weekly report shows me exactly how my twins are growing. We celebrate every badge.", avatar: "👩‍👧‍👦", name: "Emily Rodriguez", role: "Parent of twins, age 10", tint: "bg-brand-green/10" },
];

const FAQS: FaqItem[] = [
  { q: "Is LearnSign really free?", a: "Yes — every core course and feature is 100% free, because we believe every child deserves quality sign language education. Optional premium packages just add a little extra support." },
  { q: "What ages is it for?", a: "Children 3–15+, with tailored paths: Early Learners (3–4), Young Explorers (5–10), and Advanced Learners (15+). Parents and educators are warmly invited to learn right alongside them." },
  { q: "How does the webcam practice work?", a: "Your device's camera watches your child's hand movements and gives gentle, instant feedback on accuracy — adapting to their pace and suggesting what to try next." },
  { q: "Can I follow my child's progress?", a: "Absolutely. The dashboard shows lessons completed, time spent, quiz scores, and streaks — plus a friendly AI parent report you can download or print." },
  { q: "Do we need any special equipment?", a: "Nope. Any device with a camera and internet works — computer, tablet, or phone. Everything is fully responsive." },
];

export default function HomePage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-dots">
        <GradientBlobs />
        <FloatingShapes />
        <div className="container relative py-20 text-center sm:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              <span className="inline-block animate-wiggle">🤟</span> Learn ISL the joyful way
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-bold leading-[1.05] sm:text-7xl">
              Sign language,{" "}
              <span className="text-gradient">made joyful</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              A playful, AI-powered world where kids 3–15 and their grown-ups
              learn Indian Sign Language side by side — one happy sign at a time.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="rounded-full px-7 text-base shadow-lg shadow-primary/25" asChild>
                <Link href="/register">Start learning free 🎉</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-7 text-base" asChild>
                <Link href="/courses">Explore courses</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {SIGN_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-border bg-card/70 px-3 py-1 text-sm font-medium shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5"
                >
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={0.1 + i * 0.1}>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur">
                  <div className="font-display text-2xl font-bold text-primary sm:text-4xl">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <Section
        eyebrow="Why families love us"
        title="Built to make learning stick"
        subtitle="By making every lesson feel a lot more like play."
      >
        <RevealStagger className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <RevealItem key={f.title}>
              <div className="group card-base card-interactive h-full p-6">
                <div className={`flex size-16 items-center justify-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-110 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                <span className="chip mt-4 bg-secondary text-secondary-foreground">{f.highlight}</span>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Section>

      {/* ===== Age groups ===== */}
      <Section eyebrow="Find your path" title="A journey for every age" subtitle="Start exactly where your learner is today." muted>
        <RevealStagger className="grid gap-6 md:grid-cols-3">
          {AGE_GROUPS.map((g) => (
            <RevealItem key={g.title}>
              <Link
                href={g.href}
                className={`group relative flex h-full flex-col rounded-3xl border bg-gradient-to-br p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg ${g.tint} ${
                  g.featured ? "border-primary ring-2 ring-primary/30" : "border-border/70"
                }`}
              >
                {g.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                    ⭐ Most loved
                  </span>
                )}
                <div className="text-center">
                  <div className="text-5xl transition-transform duration-300 group-hover:scale-110">{g.emoji}</div>
                  <h3 className="mt-2 font-display text-xl font-semibold">{g.title}</h3>
                  <span className={`text-sm font-medium ${g.accent}`}>{g.range}</span>
                </div>
                <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">{g.description}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {g.features.map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
                <span className={`mt-5 inline-flex items-center justify-center gap-1 text-sm font-semibold ${g.accent} transition-all group-hover:gap-2`}>
                  Start this path <ArrowRight className="size-4" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      </Section>

      {/* ===== Testimonials ===== */}
      <Section eyebrow="From families like yours" title="Learning that sticks with you" subtitle="Real words from the parents and teachers who use it.">
        <RevealStagger className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <RevealItem key={t.name}>
              <figure className={`flex h-full flex-col rounded-3xl border border-border/70 p-6 shadow-soft ${t.tint}`}>
                <div className="font-display text-5xl leading-none text-primary/30">&ldquo;</div>
                <blockquote className="-mt-3 flex-1 text-sm leading-relaxed text-foreground/80">{t.text}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-card text-2xl shadow-sm">{t.avatar}</span>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealStagger>
      </Section>

      {/* ===== FAQ ===== */}
      <Section eyebrow="Good to know" title="Questions? We've got answers" subtitle="Everything you need to feel ready to start." muted>
        <Reveal>
          <Faq items={FAQS} />
        </Reveal>
      </Section>

      {/* ===== CTA ===== */}
      <section className="container py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-brand-blue to-brand-pink bg-gradient-animated animate-gradient-x px-6 py-16 text-center text-white shadow-soft-lg">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <span className="absolute left-[10%] top-6 animate-float text-3xl">🎉</span>
              <span className="absolute right-[12%] top-10 animate-float-slow text-3xl">🤟</span>
              <span className="absolute bottom-8 left-[20%] animate-float text-3xl">⭐</span>
            </div>
            <h2 className="relative text-3xl font-bold sm:text-4xl">Ready to start signing?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/85">
              Join thousands of families learning together — free to start, no card needed, all heart. 💜
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="secondary" className="rounded-full px-7 text-base" asChild>
                <Link href="/register">Create your free account</Link>
              </Button>
              <Button size="lg" variant="link" className="text-white" asChild>
                <Link href="/about">Meet the team →</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function Section({
  eyebrow,
  title,
  subtitle,
  muted,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={muted ? "bg-secondary/30 py-16 sm:py-20" : "py-16 sm:py-20"}>
      <div className="container">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
