import { db, schema } from "@/db";
import { resolveRange } from "@/lib/analytics";
import { insertGamer, insertStaff, insertStation } from "./db";

/** An IST wall-clock time as an instant, e.g. ist("2026-10-03 23:30"). */
export const ist = (local: string) => new Date(`${local.replace(" ", "T")}:00+05:30`);

/** The range every analytics test uses: business days 1–7 Oct 2026; previous period 24–30 Sep. */
export const RANGE = resolveRange({ range: "custom", from: "2026-10-01", to: "2026-10-07" }, ist("2026-11-03 15:00"));

/**
 * Known data, with the answers worked out by hand in the tests:
 *
 * In range (1–7 Oct):
 *   s1  A  St1 PS5  1 Oct 18:00–20:00  120 min  ₹300 UPI (alone)
 *   s2  A  St1 PS5  3 Oct 23:30–01:30  120 min  ┐ one ₹400 cash payment → ₹200 each
 *   s3  B  St1 PS5  3 Oct 23:30–01:30  120 min  ┘
 *   s4  C  St2 PS4  5 Oct 02:00–03:00   60 min  no amount recorded; business day 4 Oct; C later deleted
 *   s5  B  St2      6 Oct 12:00, voided          (ignored)
 *   s6  A  St2      7 Oct 15:00, still open      (ignored)
 * Previous period (24–30 Sep):
 *   s7  D  St2 PS4 28 Sep 19:00–20:00   60 min  ₹100 card
 *   s8  A  St1 PS5 29 Sep 20:00–21:00   60 min  ₹150 UPI
 */
export async function seedAnalytics() {
  const staff = await insertStaff({ role: "admin" });
  const st1 = await insertStation({ id: 1, name: "Station 01", console: "PS5" });
  const st2 = await insertStation({ id: 2, name: "Station 02", console: "PS4" });

  const a = await insertGamer({
    fullName: "Arjun A",
    memberCode: "SQ-AAAAA",
    area: "Malakpet",
    pincode: "500036",
    birthYear: 2000,
    gender: "male",
    referralSource: "instagram",
    marketingOptIn: true,
    createdAt: ist("2026-09-01 12:00"),
  });
  const b = await insertGamer({
    fullName: "Bina B",
    memberCode: "SQ-BBBBB",
    area: "Dilsukhnagar",
    pincode: "500060",
    birthYear: 2010,
    gender: "female",
    referralSource: "friend",
    createdAt: ist("2026-10-02 10:00"),
  });
  const c = await insertGamer({
    fullName: null,
    email: null,
    memberCode: "SQ-CCCCC",
    area: "Malakpet",
    pincode: "500036",
    birthYear: null,
    referralSource: "google",
    createdAt: ist("2026-10-03 12:00"),
    deletedAt: ist("2026-10-20 12:00"),
  });
  const d = await insertGamer({
    fullName: "Dev D",
    memberCode: "SQ-DDDDD",
    area: "Chaderghat",
    pincode: "500024",
    birthYear: 1999,
    referralSource: "walk_in",
    marketingOptIn: true,
    createdAt: ist("2026-08-01 12:00"),
  });

  const pay = async (stationId: number, amountPaise: number | null, method: "cash" | "upi" | "card" | null, at: string) =>
    (
      await db
        .insert(schema.payments)
        .values({ stationId, amountPaise, method, recordedBy: staff.id, createdAt: ist(at) })
        .returning({ id: schema.payments.id })
    )[0].id;

  const p1 = await pay(st1.id, 30000, "upi", "2026-10-01 20:00");
  const p2 = await pay(st1.id, 40000, "cash", "2026-10-04 01:30");
  const p3 = await pay(st2.id, null, null, "2026-10-05 03:00");
  const p4 = await pay(st2.id, 10000, "card", "2026-09-28 20:00");
  const p5 = await pay(st1.id, 15000, "upi", "2026-09-29 21:00");

  const closed = (gamerId: string, stationId: number, start: string, end: string, paymentId: string) => ({
    gamerId,
    stationId,
    status: "closed" as const,
    startedAt: ist(start),
    endedAt: ist(end),
    startedBy: staff.id,
    endedBy: staff.id,
    paymentId,
  });

  await db.insert(schema.playSessions).values([
    closed(a.id, st1.id, "2026-10-01 18:00", "2026-10-01 20:00", p1),
    closed(a.id, st1.id, "2026-10-03 23:30", "2026-10-04 01:30", p2),
    closed(b.id, st1.id, "2026-10-03 23:30", "2026-10-04 01:30", p2),
    closed(c.id, st2.id, "2026-10-05 02:00", "2026-10-05 03:00", p3),
    {
      gamerId: b.id,
      stationId: st2.id,
      status: "voided" as const,
      startedAt: ist("2026-10-06 12:00"),
      endedAt: ist("2026-10-06 12:05"),
      startedBy: staff.id,
      endedBy: staff.id,
      voidReason: "Wrong station",
    },
    { gamerId: a.id, stationId: st2.id, status: "open" as const, startedAt: ist("2026-10-07 15:00"), startedBy: staff.id },
    closed(d.id, st2.id, "2026-09-28 19:00", "2026-09-28 20:00", p4),
    closed(a.id, st1.id, "2026-09-29 20:00", "2026-09-29 21:00", p5),
  ]);

  return { staff, a, b, c, d, st1, st2 };
}
