import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Drizzle client backed by the `postgres` driver, connecting through Supabase's
 * pooler (`prepare: false` is required for pgBouncer).
 *
 * The client is cached on `globalThis` so Next's dev hot-reload reuses a single
 * connection pool instead of opening a new one on every change — which would
 * otherwise exhaust the pooler (EMAXCONNSESSION: max clients reached). `max` is
 * also capped well under the pooler's per-session limit.
 */
const connectionString = process.env.DATABASE_URL!;

const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb._pgClient ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20, // close idle connections after 20s
    max_lifetime: 60 * 30, // recycle connections every 30 min
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._pgClient = client;
}

export const db = drizzle(client, { schema });
