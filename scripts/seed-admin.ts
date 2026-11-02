/**
 * Creates the first admin account: npm run db:seed-admin
 * Reads SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD from .env.local (or the environment).
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!username || password.length < 8) {
    throw new Error("Set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD (8+ characters) in .env.local first.");
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
