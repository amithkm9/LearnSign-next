import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; message?: string }>;
}) {
  const { redirectTo, message } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue learning.</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <p className="mb-4 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            {message}
          </p>
        )}
        <GoogleButton redirectTo={redirectTo} />
        <AuthDivider />
        <LoginForm redirectTo={redirectTo} />
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
          <span className="text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create account
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
