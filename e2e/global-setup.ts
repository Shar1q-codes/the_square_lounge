import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { site } from "../src/config/site";
import { hashPassword } from "../src/server/identity/password";

config({ path: ".env.local", quiet: true });

export const E2E_ADMIN = { username: "e2e-owner", password: "e2e-owner-pass" };

/** Migrates and empties the test database, then adds the stations and one admin. */
export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set (see .env.example)");

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
    const tables = await sql<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public'`;
    await sql.unsafe(`truncate ${tables.map((t) => `"${t.tablename}"`).join(", ")} restart identity cascade`);
    await sql`
      insert into staff (username, display_name, password_hash, role)
      values (${E2E_ADMIN.username}, 'E2E Owner', ${await hashPassword(E2E_ADMIN.password)}, 'admin')`;
    for (const s of site.stations) {
      await sql`insert into stations (id, name, console, max_check_ins) values (${s.id}, ${s.name}, ${s.console}, ${s.maxCheckIns})`;
    }
  } finally {
    await sql.end();
  }
}
