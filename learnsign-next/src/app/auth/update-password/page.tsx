import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata = { title: "Set new password" };

/**
 * Landing page for the password-recovery link. By the time the user arrives,
 * /auth/callback has exchanged the recovery code for a session, so
 * supabase.auth.updateUser({ password }) works. Used by the bulk user
 * migration (all legacy users are sent a reset link).
 */
export default function UpdatePasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set a new password</CardTitle>
          <CardDescription>Choose a strong password to finish.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
