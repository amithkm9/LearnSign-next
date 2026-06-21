import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Scope file tracing to this app (the repo root also has a package-lock.json
  // from the legacy app, which would otherwise confuse Next's root inference).
  outputFileTracingRoot: __dirname,
  // Sign/course videos currently live in the legacy app's /public folder.
  // Phase 3 decides whether to move them to Supabase Storage; until then we
  // can proxy or copy them. No remote image domains needed yet.
};

export default nextConfig;
