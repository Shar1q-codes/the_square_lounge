import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { hashPassword } from "@/server/identity/password";
import { generateMemberCode } from "@/server/identity/memberCode";

/** Empties every public table. Call in beforeEach of integration tests. */
export async function resetDb() {
  const rows = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
  await db.execute(sql.raw(`truncate ${tables} restart identity cascade`));
}

export async function insertGamer(overrides: Partial<typeof schema.gamers.$inferInsert> = {}) {
  const [gamer] = await db
    .insert(schema.gamers)
    .values({
      memberCode: generateMemberCode(),
      email: `gamer-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: await hashPassword("gamer-password"),
      fullName: "Test Gamer",
      phone: "+919876543210",
      birthYear: 2000,
      area: "Malakpet",
      pincode: "500036",
      referralSource: "friend",
      ...overrides,
    })
    .returning();
  return gamer;
}

export async function insertStation(overrides: Partial<typeof schema.stations.$inferInsert> = {}) {
  const [station] = await db
    .insert(schema.stations)
    .values({ id: Math.floor(Math.random() * 1e6) + 100, name: "Test Station", console: "PS5", maxCheckIns: 8, ...overrides })
    .returning();
  return station;
}

export async function insertStaff(overrides: Partial<typeof schema.staff.$inferInsert> = {}) {
  const [member] = await db
    .insert(schema.staff)
    .values({
      username: `staff${Math.random().toString(36).slice(2, 8)}`,
      displayName: "Counter Staff",
      passwordHash: await hashPassword("staff-password"),
      role: "staff",
      ...overrides,
    })
    .returning();
  return member;
}
