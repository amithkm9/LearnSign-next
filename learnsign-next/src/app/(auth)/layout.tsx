import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-lg font-bold"
        >
          <span aria-hidden>🤟</span> LearnSign
        </Link>
        {children}
      </div>
    </div>
  );
}
