"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Mail, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "learnsign.support@gmail.com";
const SUPPORT_PHONE = "+91 70229 55705";

type Tier = {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  popular?: boolean;
  features: string[];
  cta: { type: "link"; label: string; href: string } | { type: "pay" } | { type: "contact" };
};

const TIERS: Tier[] = [
  {
    id: "basics",
    icon: "📖",
    name: "Basics",
    tagline: "Self-paced fun for everyone",
    price: "Free",
    period: "forever",
    features: [
      "All video lessons",
      "Interactive sign quizzes",
      "Webcam sign practice",
      "AI tutor (SignMentor)",
      "Progress tracking & badges",
    ],
    cta: { type: "link", label: "Start learning free", href: "/register" },
  },
  {
    id: "tutor",
    icon: "👩‍🏫",
    name: "Personal Tutor",
    tagline: "1-on-1 with a certified expert",
    price: "₹2,000",
    period: "per month",
    popular: true,
    features: [
      "Everything in Basics",
      "1-on-1 live sessions with a certified ISL tutor",
      "A learning plan made just for your child",
      "Weekly progress calls with parents",
      "Homework & personal feedback",
      "Completion certificate",
    ],
    cta: { type: "pay" },
  },
  {
    id: "ngo",
    icon: "🏫",
    name: "NGO & Schools",
    tagline: "Bulk learning for institutions",
    price: "Custom",
    period: "for your group",
    features: [
      "Unlimited student accounts",
      "Teacher & admin dashboard",
      "Bulk progress tracking",
      "Custom curriculum & training",
      "Dedicated support manager",
      "Special pricing for NGOs ❤️",
    ],
    cta: { type: "contact" },
  },
];

export function PricingTiers() {
  const [showPay, setShowPay] = useState(false);

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "relative flex h-full flex-col rounded-3xl border bg-card p-6 shadow-soft transition-all duration-300 sm:p-7",
              tier.popular
                ? "border-primary ring-2 ring-primary/30 lg:-translate-y-3 lg:scale-[1.02]"
                : "border-border/70 hover:-translate-y-1.5 hover:shadow-soft-lg",
            )}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                ⭐ Most popular
              </span>
            )}

            <div className="text-4xl">{tier.icon}</div>
            <h3 className="mt-3 font-display text-xl font-bold">{tier.name}</h3>
            <p className="text-sm text-muted-foreground">{tier.tagline}</p>

            {/* Price */}
            <div className="mt-5 flex items-end gap-1.5">
              <span className="font-display text-4xl font-extrabold text-primary">{tier.price}</span>
              <span className="mb-1.5 text-sm text-muted-foreground">{tier.period}</span>
            </div>

            {/* Features */}
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-7">
              {tier.cta.type === "link" && (
                <Button asChild className="w-full rounded-full" variant="outline">
                  <Link href={tier.cta.href}>{tier.cta.label}</Link>
                </Button>
              )}

              {tier.cta.type === "pay" && (
                <Button className="w-full rounded-full" onClick={() => setShowPay(true)}>
                  Start learning
                </Button>
              )}

              {tier.cta.type === "contact" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-secondary/60 p-3 text-sm">
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 hover:text-primary">
                      <Mail className="size-4 text-primary" /> {SUPPORT_EMAIL}
                    </a>
                    <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="mt-2 flex items-center gap-2 hover:text-primary">
                      <Phone className="size-4 text-primary" /> {SUPPORT_PHONE}
                    </a>
                  </div>
                  <Button asChild className="w-full rounded-full" variant="outline">
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=LearnSign%20for%20our%20school/NGO`}>
                      Contact us
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment-required modal for the Personal Tutor tier */}
      <AnimatePresence>
        {showPay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowPay(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-card p-7 text-center shadow-soft-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPay(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              <div className="text-5xl">💳</div>
              <h3 className="mt-3 font-display text-xl font-bold">Personal Tutor plan</h3>
              <div className="mt-3 flex items-end justify-center gap-1.5">
                <span className="font-display text-3xl font-extrabold text-primary">₹2,000</span>
                <span className="mb-1 text-sm text-muted-foreground">per month</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                To start 1-on-1 lessons with a certified tutor, this plan is{" "}
                <span className="font-semibold text-foreground">₹2,000 per month</span>.
                Online payment is coming soon — for now, reach out and we&apos;ll get
                you set up!
              </p>
              <div className="mt-6 grid gap-2">
                <Button asChild className="rounded-full">
                  <a href={`mailto:${SUPPORT_EMAIL}?subject=Personal%20Tutor%20plan`}>
                    Contact us to enroll
                  </a>
                </Button>
                <Button variant="ghost" className="rounded-full" onClick={() => setShowPay(false)}>
                  Maybe later
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
