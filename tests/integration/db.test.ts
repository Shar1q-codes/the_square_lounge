import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";

type TableRow = { table_name: string; rls: boolean };

describe("database schema", () => {
  it("creates the identity tables", async () => {
    const rows = await db.execute<TableRow>(sql`
      select c.relname as table_name, c.relrowsecurity as rls
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'`);
    const names = rows.map((r) => r.table_name);

    expect(names).toEqual(
      expect.arrayContaining(["gamers", "staff", "consents", "auth_sessions", "login_attempts", "audit_log"]),
    );
  });

  it("enables row-level security on every public table, so Supabase's Data API exposes nothing", async () => {
    const rows = await db.execute<TableRow>(sql`
      select c.relname as table_name, c.relrowsecurity as rls
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'`);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((r) => !r.rls).map((r) => r.table_name)).toEqual([]);
  });
});
