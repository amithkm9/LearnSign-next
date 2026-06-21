/**
 * One-off migration: import legacy users into Supabase Auth.
 *
 * The old app stored passwords in PLAINTEXT, so we do NOT carry them over.
 * Each user is created (email pre-confirmed) and sent a password-reset email;
 * they set a fresh password on first sign-in. The handle_new_user() trigger
 * fills in their profile from the metadata we pass here.
 *
 * Usage:
 *   1. Export legacy users from Mongo:
 *        mongoexport --uri="$MONGODB_URI" --collection=users \
 *          --fields=email,name,phone,userType,ageGroup --type=json \
 *          --out=users.json
 *   2. Ensure learnsign-next/.env.local has NEXT_PUBLIC_SUPABASE_URL and
 *      SUPABASE_SERVICE_ROLE_KEY.
 *   3. node --env-file=.env.local scripts/import-users.ts users.json
 *
 * Optional: set APP_URL (defaults to http://localhost:3000) so the reset
 * links point at the right host.
 *
 * Node 20.6+ supports --env-file; Node 22.6+/23+ runs .ts directly.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

type LegacyUser = {
  email: string;
  name?: string;
  phone?: string;
  userType?: string;
  ageGroup?: string;
};

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/import-users.ts <users.json>");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// mongoexport produces either a JSON array or newline-delimited JSON.
function parseUsers(raw: string): LegacyUser[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function main() {
  const users = parseUsers(readFileSync(file, "utf8"));
  console.log(`Importing ${users.length} users…`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of users) {
    if (!u.email) {
      skipped++;
      continue;
    }

    const { error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      email_confirm: true, // legacy emails are considered verified
      user_metadata: {
        name: u.name ?? "Learner",
        phone: u.phone ?? null,
        user_type: u.userType ?? "parent",
        age_group: u.ageGroup ?? null,
      },
    });

    if (createErr) {
      // Most common cause: the user already exists from a previous run.
      if (/already/i.test(createErr.message)) {
        skipped++;
      } else {
        failed++;
        console.warn(`  ✗ ${u.email}: ${createErr.message}`);
      }
      continue;
    }

    // Send a reset link so they set a real password.
    const { error: resetErr } = await admin.auth.resetPasswordForEmail(u.email, {
      redirectTo: `${APP_URL}/auth/callback?next=/auth/update-password`,
    });
    if (resetErr) console.warn(`  ! reset email failed for ${u.email}: ${resetErr.message}`);

    created++;
    if (created % 25 === 0) console.log(`  …${created} created`);
  }

  console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
