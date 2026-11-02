/**
 * Applies the SQL migrations in drizzle/ to the chosen database. Safe to run again: applied
 * migrations are skipped.
 *   npm run supabase:migrate      (live Supabase)
 *   npm run db:migrate            (local; uses drizzle-kit)
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { run, useTarget } from "./target";

run(async () => {
  useTarget();
  const client = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
    console.log("Migrations applied (already-applied ones were skipped).");
  } finally {
    await client.end();
  }
});
