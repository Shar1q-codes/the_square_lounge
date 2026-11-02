/**
 * Picks the database a script works on and points the app's DB client at it.
 *   (default)    DATABASE_URL       your local Docker database
 *   --supabase   SUPABASE_DB_URL    the live Supabase database (Session pooler URI)
 * Call before importing anything that uses the database.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

export type Target = { name: "local" | "supabase"; host: string };

export function useTarget(argv = process.argv): Target {
  const supabase = argv.includes("--supabase");
  const url = supabase ? process.env.SUPABASE_DB_URL : process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      supabase
        ? "SUPABASE_DB_URL is not set. Add the Supabase Session pooler URI to .env.local (see README)."
        : "DATABASE_URL is not set (see .env.example).",
    );
  }
  const host = new URL(url).hostname;
  if (supabase && (host === "localhost" || host === "127.0.0.1")) {
    throw new Error("SUPABASE_DB_URL points at localhost. Use the Supabase Session pooler URI.");
  }
  process.env.DATABASE_URL = url;
  // Never print the URL itself: it contains the database password.
  console.log(`Database: ${supabase ? "Supabase" : "local"} (${host})`);
  return { name: supabase ? "supabase" : "local", host };
}

export function run(main: () => Promise<void>) {
  main()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
