import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { site } from "@/config/site";
import { syncStations } from "@/server/sessions/stations";
import { resetDb } from "../../support/db";

beforeEach(resetDb);

describe("syncStations", () => {
  it("copies the site's stations with their check-in limits", async () => {
    await syncStations();
    const rows = await db.select().from(schema.stations).orderBy(asc(schema.stations.id));

    expect(rows.map((r) => [r.id, r.name, r.console, r.maxCheckIns, r.active])).toEqual(
      site.stations.map((s) => [s.id, s.name, s.console, s.maxCheckIns, true]),
    );
  });

  it("is safe to run again", async () => {
    await syncStations();
    await syncStations();

    expect(await db.select().from(schema.stations)).toHaveLength(site.stations.length);
  });

  it("deactivates a station that is no longer in the config", async () => {
    await db.insert(schema.stations).values({ id: 99, name: "Old Station", console: "PS4" });
    await syncStations();
    const [old] = await db.select().from(schema.stations).where(eq(schema.stations.id, 99));

    expect(old.active).toBe(false);
  });
});
