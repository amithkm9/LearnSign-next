import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/packages", label: "Packages" },
  { href: "/tutor", label: "AI Tutor" },
  { href: "/about", label: "About" },
  { href: "/community", label: "Community" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-border/60 bg-secondary/30">
      {/* Playful top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-brand-pink to-brand-orange" />

      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="inline-block animate-wiggle">🤟</span>
            <span>
              <span className="text-gradient">Learn</span>Sign
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            An interactive, AI-powered playground for learning Indian Sign
            Language. Breaking barriers, one joyful sign at a time. 💜
          </p>
          <div className="mt-4 flex gap-2 text-xl">
            {["👋", "🤟", "✋", "👌"].map((e, i) => (
              <span key={i} className="animate-bounce-slow" style={{ animationDelay: `${i * 0.2}s` }}>
                {e}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Explore</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Get in touch</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="tel:+917022955705" className="transition-colors hover:text-primary">
                📞 +91 70229 55705
              </a>
            </li>
            <li>
              <a href="mailto:learnsign.support@gmail.com" className="transition-colors hover:text-primary">
                ✉️ learnsign.support@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-5">
        <p className="container text-center text-xs text-muted-foreground">
          © {year} LearnSign · Made with 💜 for the deaf and hard-of-hearing community
        </p>
      </div>
    </footer>
  );
}
