/**
 * npm run db:seed: copies stations from src/config/site.ts into the database and creates the first
 * admin from SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD (.env.local). Safe to run again.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  const { syncStations } = await import("../src/server/sessions/stations");
  console.log(`Stations synced: ${await syncStations()}.`);

  const username = process.env.SEED_ADMIN_USERNAME?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!username || password.length < 8) {
    console.log("Admin skipped: set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD (8+ characters) in .env.local.");
    return;
  }
  const { seedAdmin } = await import("../src/server/identity/staff");
  const result = await seedAdmin(username, password);
  console.log(result === "created" ? `Admin "${username}" created.` : `Admin "${username}" already exists; nothing changed.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
