import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";
import {
  RECOVERY_COOKIE,
  RECOVERY_TTL_MS,
  signRecoveryGrant,
} from "@/lib/recovery-grant";

const UPDATE_PASSWORD_PATH = "/auth/update-password";

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);

      // Reaching here means Supabase accepted a recovery code, so this user has
      // proved mailbox control and may set a password without the old one. The
      // grant is signed and httpOnly precisely so a client can't mint its own.
      if (next === UPDATE_PASSWORD_PATH && data.user) {
        response.cookies.set(RECOVERY_COOKIE, signRecoveryGrant(data.user.id), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: RECOVERY_TTL_MS / 1000,
        });
      }

      return response;
    }
  }

  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent("Sign-in link was invalid or expired. Please try again.")}`,
  );
}
