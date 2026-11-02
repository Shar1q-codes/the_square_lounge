import "server-only";
import { notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { site } from "@/config/site";

/**
 * Copies stations from src/config/site.ts into the database (insert or update by id).
 * Stations removed from the config are deactivated, not deleted, so their history stays.
 */
export async function syncStations() {
  const rows = site.stations.map((s) => ({ id: s.id, name: s.name, console: s.console, maxCheckIns: s.maxCheckIns }));
  await db.transaction(async (tx) => {
    await tx
      .insert(schema.stations)
      .values(rows.map((r) => ({ ...r, active: true })))
      .onConflictDoUpdate({
        target: schema.stations.id,
        set: {
          name: sql`excluded.name`,
          console: sql`excluded.console`,
          maxCheckIns: sql`excluded.max_check_ins`,
          active: true,
          updatedAt: sql`now()`,
        },
      });
    await tx
      .update(schema.stations)
      .set({ active: false, updatedAt: sql`now()` })
      .where(notInArray(schema.stations.id, rows.map((r) => r.id)));
  });
  return rows.length;
}
