import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/**
 * Exchanges the `?code=` from email-confirmation / password-recovery /
 * OAuth links for a session, then redirects. `next` lets the recovery flow
 * land on /auth/update-password.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate `next` so a crafted link can't redirect off-site after sign-in.
  const next = safeRedirectPath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent("Sign-in link was invalid or expired. Please try again.")}`,
  );
}
