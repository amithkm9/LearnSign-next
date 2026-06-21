// Runs a .sql file against the database in DATABASE_URL (from .env).
// Used for the Supabase-specific RLS/trigger SQL that drizzle-kit can't generate.
//   node scripts/apply-sql.mjs drizzle/manual/0001_profiles_rls_trigger.sql
import { readFileSync } from "node:fs";
import postgres from "postgres";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-sql.mjs <file.sql>");
  process.exit(1);
}

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");

const sqlText = readFileSync(file, "utf8");
const sql = postgres(url, { ssl: "require", prepare: false, max: 1 });

try {
  await sql.unsafe(sqlText);
  console.log(`Applied ${file} ✓`);
} catch (e) {
  console.error(`Failed to apply ${file}:`, e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
