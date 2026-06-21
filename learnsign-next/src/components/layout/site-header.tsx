import Link from "next/link";
import Image from "next/image";
import { getProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MainNav } from "./main-nav";
import { UserMenu } from "./user-menu";

/** Auth-aware site header. Server component — reads the session/profile. */
export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2 font-bold">
          <Image
            src="/assets/imgs/learnsign-logo.png"
            alt="LearnSign"
            width={36}
            height={36}
            className="rounded-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
            priority
          />
          <span className="font-display text-xl tracking-tight">
            <span className="text-gradient">Learn</span>Sign
          </span>
        </Link>

        <MainNav isAuthed={!!profile} />

        <div className="flex items-center gap-2">
          {profile ? (
            <UserMenu name={profile.name} email={profile.email} />
          ) : (
            <Button asChild className="rounded-full">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
