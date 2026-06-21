import { PricingTiers } from "@/components/packages/pricing-tiers";

export const metadata = {
  title: "Plans",
  description:
    "LearnSign plans — free self-paced learning, 1-on-1 personal tutoring, and bulk programs for NGOs and schools.",
};

export default function PackagesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-dots">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/70 via-background to-background" />
        <div className="container relative py-16 text-center sm:py-20">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Pick a <span className="text-gradient">learning plan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start free and self-paced, add a personal tutor for 1-on-1 lessons,
            or bring LearnSign to your whole school or NGO.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="container pb-20">
        <PricingTiers />
      </section>
    </>
  );
}
