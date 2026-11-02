/**
 * Copies stations from src/config/site.ts into the database and creates the first admin from
 * SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD (.env.local). Safe to run again: an existing admin is
 * never changed.
 *   npm run db:seed               (local)
 *   npm run supabase:seed         (live Supabase; needs a strong admin password)
 */
import { run, useTarget } from "./target";

const EXAMPLE_PASSWORD = "change-me-now";

run(async () => {
  const target = useTarget();
  const { syncStations } = await import("../src/server/sessions/stations");
  console.log(`Stations synced: ${await syncStations()}.`);

  const username = process.env.SEED_ADMIN_USERNAME?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!username || password.length < 8) {
    console.log("Admin skipped: set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD (8+ characters) in .env.local.");
    return;
  }
  // Same rule as staff created in the app, so a placeholder like "<your admin username>" can't slip through.
  if (!/^[a-z0-9_.]{3,32}$/.test(username.toLowerCase())) {
    throw new Error("SEED_ADMIN_USERNAME must be 3–32 letters, numbers, dots or underscores (e.g. owner).");
  }
  // The example password is public on GitHub (.env.example), so it must never reach the live database.
  if (target.name === "supabase" && (password === EXAMPLE_PASSWORD || password.length < 12)) {
    throw new Error("For Supabase, set SEED_ADMIN_PASSWORD in .env.local to a strong password (12+ characters, not the example one).");
  }
  const { seedAdmin } = await import("../src/server/identity/staff");
  const result = await seedAdmin(username, password);
  console.log(result === "created" ? `Admin "${username}" created.` : `Admin "${username}" already exists; nothing changed.`);
});
