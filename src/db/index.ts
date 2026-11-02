import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { squareLoungeDb?: Database };

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  // prepare: false lets this run through Supabase's transaction pooler.
  const client = postgres(url, { prepare: false, max: 10, onnotice: () => {} });
  return drizzle(client, { schema });
}

/** Server-only Drizzle client. Created on first use so builds don't need a database. */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    globalForDb.squareLoungeDb ??= createDb();
    return Reflect.get(globalForDb.squareLoungeDb, prop);
  },
});

export { schema };
