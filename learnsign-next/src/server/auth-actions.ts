"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";
import { RECOVERY_COOKIE, verifyRecoveryGrant } from "@/lib/recovery-grant";
import {
  loginSchema,
  registerSchema,
  emailSchema,
  newPasswordSchema,
} from "@/lib/validations/auth";

export type AuthState = {
  error: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
};

async function getOrigin() {
  // Password-reset and email-confirm links are built from this, so it must not
  // be attacker-influenced: `Origin` and `Host` are request headers a client
  // controls, and a poisoned value turns a reset email into a phishing link.
  // Production therefore REQUIRES an explicitly configured site URL; the header
  // fallback exists only for local development.
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set in production — auth email links are built from it.",
    );
  }

  const h = await headers();
  return h.get("origin") ?? `http://${h.get("host") ?? "localhost:3000"}`;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: "Please check your input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("redirectTo") as string | null, "/dashboard"));
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    userType: formData.get("userType") || "parent",
    ageGroup: formData.get("ageGroup"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, userType, ageGroup, password } = parsed.data;
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Consumed by the handle_new_user() trigger to populate `profiles`.
      data: {
        name,
        phone: phone || null,
        user_type: userType,
        age_group: ageGroup || null,
      },
    },
  });
  if (error) return { error: error.message };

  // Email confirmation on → no session yet.
  if (data.user && !data.session) {
    return {
      error: null,
      message: "Account created! Check your email to confirm, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Enter a valid email." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });
  if (error) return { error: error.message };

  return {
    error: null,
    message: "If that email exists, a password reset link is on its way.",
  };
}

/**
 * Sets a new password.
 *
 * A valid session alone is not enough: a borrowed or hijacked session would
 * otherwise convert straight into permanent account ownership. Users who got
 * here through a recovery link have already proved control of the mailbox, so
 * they are exempt; everyone else must re-enter their current password.
 */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  // Only /auth/callback issues this grant, and only after Supabase accepted a
  // real recovery code — so it can stand in for the current password.
  const cookieStore = await cookies();
  const viaRecovery = verifyRecoveryGrant(
    cookieStore.get(RECOVERY_COOKIE)?.value,
    user.id,
  );

  // Google-only accounts have no password to re-enter; they'd be stuck on a
  // form they can never satisfy. Send them through the email flow instead.
  const hasPasswordIdentity =
    !user.identities || user.identities.some((i) => i.provider === "email");

  if (!viaRecovery && !hasPasswordIdentity) {
    return {
      error:
        "This account signs in with Google. Use “Forgot password” to set a password by email.",
    };
  }

  if (!viaRecovery) {
    const currentPassword = formData.get("currentPassword");
    if (typeof currentPassword !== "string" || !currentPassword) {
      return {
        error: "Enter your current password to change it.",
        fieldErrors: { currentPassword: ["Current password is required"] },
      };
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password: currentPassword,
    });
    if (reauthError) {
      return {
        error: "That current password is incorrect.",
        fieldErrors: { currentPassword: ["Incorrect password"] },
      };
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  // One grant, one password change.
  cookieStore.delete(RECOVERY_COOKIE);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
