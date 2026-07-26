import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Origin of a configured URL, or nothing if it isn't set / isn't absolute. */
function origin(url: string | undefined): string[] {
  if (!url) return [];
  try {
    return [new URL(url).origin];
  } catch {
    return [];
  }
}

// Videos are served from object storage in production, and the browser talks to
// Supabase Auth directly, so both origins have to be allowed explicitly.
const mediaOrigins = origin(process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
const supabaseOrigins = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Next's App Router injects inline bootstrap/hydration scripts and styles, so
// 'unsafe-inline' is required here. Tightening this to a nonce means generating
// one per request in middleware and threading it through — worth doing, but it
// is a behavioural change, not a config tweak.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${mediaOrigins.join(" ")}`.trim(),
  `media-src 'self' blob: data: ${mediaOrigins.join(" ")}`.trim(),
  `font-src 'self' data:`,
  `connect-src 'self' ${supabaseOrigins.join(" ")} ${mediaOrigins.join(" ")}`.trim(),
  `worker-src 'self' blob:`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The quiz needs the camera and the tutor needs the mic — same-origin only.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Scope file tracing to this app (the repo root also has a package-lock.json
  // from the legacy app, which would otherwise confuse Next's root inference).
  outputFileTracingRoot: __dirname,
  // Sign/course videos are served from Supabase Storage in production via
  // NEXT_PUBLIC_MEDIA_BASE_URL; locally they resolve out of /public.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
