/**
 * Upload the sign/course videos to a Supabase Storage bucket so the deployed app
 * can serve them (they're too big for git/Vercel). Mirrors the /assets/videos/…
 * path so `mediaUrl()` resolves: <NEXT_PUBLIC_MEDIA_BASE_URL>/assets/videos/…
 *
 * Run from learnsign-next/ with env loaded:
 *   node --env-file=.env.local scripts/upload-media.mjs
 *
 * NEXT_PUBLIC_MEDIA_BASE_URL then =
 *   https://<project>.supabase.co/storage/v1/object/public/media
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.MEDIA_BUCKET || "media";
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const VIDEOS_DIR = join(root, "public", "assets", "videos");
const CONTENT_TYPE = { ".webm": "video/webm", ".mp4": "video/mp4" };

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

async function main() {
  // Ensure a public bucket exists (ignore "already exists").
  const { error: be } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (be && !/exist/i.test(be.message)) throw be;

  let ok = 0,
    fail = 0;
  for await (const file of walk(VIDEOS_DIR)) {
    const ext = extname(file).toLowerCase();
    if (!CONTENT_TYPE[ext]) continue;
    const key = `assets/videos/${relative(VIDEOS_DIR, file).split("\\").join("/")}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, await readFile(file), { contentType: CONTENT_TYPE[ext], upsert: true });
    if (error) {
      console.error("✗", key, error.message);
      fail++;
    } else {
      ok++;
      if (ok % 25 === 0) console.log(`  …${ok} uploaded`);
    }
  }
  console.log(`\nDone: ${ok} uploaded, ${fail} failed → bucket "${BUCKET}".`);
  console.log(
    `Set NEXT_PUBLIC_MEDIA_BASE_URL=${URL}/storage/v1/object/public/${BUCKET}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
