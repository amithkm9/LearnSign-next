import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load Next-style env files. .env.local wins if present; .env fills the rest.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
