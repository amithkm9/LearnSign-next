// Read-only check that Phase 1 DB objects exist.
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", prepare: false, max: 1 });

try {
  const cols = await sql`
    select column_name, data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
    order by ordinal_position`;
  console.log(`profiles columns (${cols.length}):`,
    cols.map((c) => c.column_name).join(", "));

  const [rls] = await sql`
    select relrowsecurity from pg_class
    where oid = 'public.profiles'::regclass`;
  console.log("RLS enabled on profiles:", rls?.relrowsecurity);

  const policies = await sql`
    select policyname, cmd from pg_policies
    where schemaname = 'public' and tablename = 'profiles'`;
  console.log("policies:", policies.map((p) => `${p.policyname} (${p.cmd})`).join(" | "));

  const triggers = await sql`
    select tgname, relname
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where tgname in ('on_auth_user_created', 'profiles_set_updated_at')`;
  console.log("triggers:", triggers.map((t) => `${t.tgname} on ${t.relname}`).join(" | "));

  const [fn] = await sql`select proname from pg_proc where proname = 'handle_new_user'`;
  console.log("handle_new_user function:", fn ? "present" : "MISSING");

  const [count] = await sql`select count(*)::int as n from public.profiles`;
  console.log("profiles row count:", count.n);
} catch (e) {
  console.error("Verify failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
