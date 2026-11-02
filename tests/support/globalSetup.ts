import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { pointAppAtTestDatabase } from "./env";

/** Applies all migrations to the test database once per test run. */
export default async function setup() {
  const client = postgres(pointAppAtTestDatabase(), { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  } finally {
    await client.end();
  }
}
