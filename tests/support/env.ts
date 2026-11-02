import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

/** Points the app's DB client at the test database. Throws if it isn't configured. */
export function pointAppAtTestDatabase(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set (see .env.example)");
  process.env.DATABASE_URL = url;
  return url;
}
