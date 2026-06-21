import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles, type Profile } from "@/lib/db/schema";

/** The authenticated Supabase user (or null). Cached per request. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export type ProfileWithEmail = Profile & { email: string };

/** The current user's profile joined with their auth email (or null). */
export const getProfile = cache(async (): Promise<ProfileWithEmail | null> => {
  const user = await getUser();
  if (!user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return null;
  return { ...profile, email: user.email ?? "" };
});

/** Guard for server components/actions — redirects to /login if signed out. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
