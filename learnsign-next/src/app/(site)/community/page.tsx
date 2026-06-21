import { ArrowRight, Heart, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";

export const metadata = {
  title: "Community",
  description:
    "Inspiring real-world stories of Deaf and hard-of-hearing achievers who overcame barriers to follow their dreams.",
};

const STORIES = [
  {
    img: "/assets/imgs/a.png",
    name: "Sudeep Shukla",
    role: "IAS Officer · Disability Rights Advocate",
    tags: ["Civil Services", "Public Policy", "Accessibility"],
    description:
      "Made history as one of India's first Deaf civil servants. From a small town in Madhya Pradesh, he overcame profound communication barriers to clear one of the country's toughest examinations — and now champions a more inclusive India.",
    quote:
      "Disabilities are not a hindrance; they are just a different way of living. My aim is to make India more inclusive and accessible to all.",
    link: "https://edtimes.in/sudeep-shukla-indias-first-deaf-and-mute-person-contesting-mp-elections-has-the-disabled-community-behind-him/",
  },
  {
    img: "/assets/imgs/b.png",
    name: "Nishtha Dudeja",
    role: "Miss Deaf India · Tennis Player",
    tags: ["Miss Deaf World 2018", "Sports", "Women Empowerment"],
    description:
      "The first Indian to win the Miss Deaf World title (2018). Born with profound hearing loss, she's also an accomplished tennis player who has represented India in the Deaflympics.",
    quote:
      "Being differently-abled doesn't make you any less capable. Focus on your strengths. I want to inspire Deaf girls to pursue their dreams fearlessly.",
    link: "https://en.wikipedia.org/wiki/Nishtha_Dudeja",
    tint: "bg-brand-pink/10",
  },
  {
    img: "/assets/imgs/c.png",
    name: "Vaibhav Kothari",
    role: "Tech Entrepreneur · Innovator",
    tags: ["Technology", "Entrepreneurship", "Social Impact"],
    description:
      "Born with severe hearing impairment, this IIT Delhi alumnus founded SignAble Communications — building apps that translate sign language to text and voice in real time.",
    quote:
      "Technology has the power to bridge communication gaps. Every Deaf person deserves tools to connect with the world without barriers.",
    link: "https://lifebeyondnumbers.com/vaibhav-kothari-inspiring-deaf/",
    tint: "bg-brand-green/10",
  },
];

const COMMUNITY_PERKS = [
  { icon: Heart, title: "A welcoming space", text: "Learn alongside families and educators who get the journey." },
  { icon: MessageCircle, title: "Share & ask", text: "Celebrate wins, swap tips, and ask questions any time." },
  { icon: Sparkles, title: "Grow together", text: "We're just getting started — help shape what comes next." },
];

export default function CommunityPage() {
  const [featured, ...rest] = STORIES;

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-blue/20 via-secondary to-brand-pink/20 py-20 text-center sm:py-24">
        <div className="container">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              💛 Real people, real achievements
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
              Inspiring <span className="text-gradient">success stories</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Deaf and hard-of-hearing achievers who overcame barriers to follow
              their dreams — proof of what&apos;s possible, and why we do this.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== Stories ===== */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">🌟 Inspiring journeys</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Champions who lead the way</h2>
            <p className="mt-3 text-muted-foreground">
              Remarkable people who shattered stereotypes and achieved exceptional success.
            </p>
          </Reveal>

          {/* Featured story */}
          <Reveal>
            <article className="card-base group mb-8 overflow-hidden lg:grid lg:grid-cols-2">
              <div className="h-64 overflow-hidden lg:h-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.img}
                  alt={featured.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col p-6 sm:p-8">
                <span className="chip w-fit bg-primary/10 text-primary">⭐ Featured story</span>
                <h3 className="mt-3 font-display text-2xl font-bold">{featured.name}</h3>
                <p className="text-sm font-medium text-primary">{featured.role}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {featured.tags.map((t) => (
                    <span key={t} className="chip bg-secondary text-secondary-foreground">{t}</span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{featured.description}</p>
                <blockquote className="mt-4 rounded-2xl border-l-4 border-primary bg-secondary/50 p-4 text-sm italic leading-relaxed text-foreground">
                  {featured.quote}
                </blockquote>
                <a
                  href={featured.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2"
                >
                  Read full story <ArrowRight className="size-4" />
                </a>
              </div>
            </article>
          </Reveal>

          {/* Remaining stories */}
          <RevealStagger className="grid gap-8 md:grid-cols-2" stagger={0.12}>
            {rest.map((s) => (
              <RevealItem key={s.name}>
                <article className="card-base card-interactive group flex h-full flex-col overflow-hidden">
                  <div className="h-56 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.img}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-bold">{s.name}</h3>
                    <p className="text-sm font-medium text-primary">{s.role}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.tags.map((t) => (
                        <span key={t} className="chip bg-primary/10 text-primary">{t}</span>
                      ))}
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                    <blockquote className={`mt-4 rounded-2xl border-l-4 border-primary p-3 text-sm italic leading-relaxed text-foreground ${s.tint}`}>
                      {s.quote}
                    </blockquote>
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2"
                    >
                      Read full story <ArrowRight className="size-4" />
                    </a>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>

          {/* ===== Join community ===== */}
          <Reveal>
            <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-brand-blue to-brand-pink bg-gradient-animated animate-gradient-x p-8 text-center text-white shadow-soft-lg sm:p-12">
              <h3 className="text-2xl font-bold sm:text-3xl">Join our growing community</h3>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                We&apos;re just getting started — and we&apos;d love for you to be
                part of it. Connect with fellow learners in a safe, welcoming space.
              </p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
                {COMMUNITY_PERKS.map((p) => (
                  <div key={p.title} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p.icon className="mx-auto size-6" />
                    <h4 className="mt-2 text-sm font-semibold">{p.title}</h4>
                    <p className="mt-1 text-xs text-white/80">{p.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                {/* TODO: replace with the real WhatsApp invite link before launch */}
                <Button size="lg" variant="secondary" className="rounded-full px-7" asChild>
                  <a href="https://chat.whatsapp.com/learnsign-community" target="_blank" rel="noopener noreferrer">
                    Join the WhatsApp group 💬
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
