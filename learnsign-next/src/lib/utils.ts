import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a media path (sign/course videos) to its hosted URL. In production the
 * ~340 MB of videos are served from object storage / a CDN via
 * NEXT_PUBLIC_MEDIA_BASE_URL; locally it's empty so paths stay relative to /public.
 * Pass an already-absolute URL through untouched.
 */
export function mediaUrl(path: string): string {
  if (!path || /^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";
  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}

/**
 * Returns `path` only if it is a safe same-origin relative path, otherwise the
 * fallback. Prevents open-redirects: rejects absolute URLs, protocol-relative
 * (`//host`), backslash tricks (`/\host`) and control characters. Use for any
 * user-supplied post-auth redirect target.
 */
export function safeRedirectPath(
  path: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!path) return fallback;
  // Must be a single-slash absolute path, no control chars or backslashes.
  if (!path.startsWith("/") || /[\\\x00-\x1f]/.test(path)) return fallback;
  // Reject protocol-relative ("//evil.com") which browsers treat as absolute.
  if (path.startsWith("//")) return fallback;
  return path;
}
