"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

const PUBLIC_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/packages", label: "Packages" },
  { href: "/tutor", label: "AI Tutor" },
  { href: "/about", label: "About" },
  { href: "/community", label: "Community" },
];

const AUTHED_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quiz", label: "Quiz" },
];

export function MainNav({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = isAuthed ? [...PUBLIC_LINKS, ...AUTHED_LINKS] : PUBLIC_LINKS;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-0.5 md:flex">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                active ? "text-primary" : "text-foreground/70",
              )}
            >
              {link.label}
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-primary/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile toggle */}
      <button
        type="button"
        aria-label="Toggle menu"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full z-50 border-b bg-background/95 p-4 shadow-lg backdrop-blur md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
