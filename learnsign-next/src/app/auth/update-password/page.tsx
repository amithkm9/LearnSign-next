import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { RECOVERY_COOKIE, verifyRecoveryGrant } from "@/lib/recovery-grant";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata = { title: "Set new password" };

/**
 * Landing page for the password-recovery link. By the time the user arrives,
 * /auth/callback has exchanged the recovery code for a session, so
 * supabase.auth.updateUser({ password }) works. Used by the bulk user
 * migration (all legacy users are sent a reset link).
 *
 * Signed-in users who did NOT arrive via a recovery link can change their
 * password here too, but must re-enter the current one.
 */
export default async function UpdatePasswordPage() {
  const user = await getUser();
  if (!user) redirect("/login?redirectTo=/auth/update-password");

  const cookieStore = await cookies();
  const viaRecovery = verifyRecoveryGrant(
    cookieStore.get(RECOVERY_COOKIE)?.value,
    user.id,
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set a new password</CardTitle>
          <CardDescription>
            {viaRecovery
              ? "Choose a strong password to finish."
              : "Confirm your current password, then choose a new one."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm viaRecovery={viaRecovery} />
        </CardContent>
      </Card>
    </div>
  );
}
