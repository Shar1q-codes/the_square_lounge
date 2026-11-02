import "server-only";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { PRIVACY_NOTICE_VERSION } from "@/config/privacy";
import { loyalty } from "@/config/loyalty";
import { businessDate } from "@/lib/analytics";
import { pointsFor } from "@/lib/loyalty";
import { generateMemberCode } from "@/server/identity/memberCode";
import { hashPassword } from "@/server/identity/password";
import { syncStations } from "@/server/sessions/stations";

/**
 * Demo data for trying the app: ~40 members around Malakpet, two months of visits, payments,
 * points, offers and vouchers, a counter staff account, and a few members playing right now.
 * Everything is tagged (emails on DEMO_EMAIL_DOMAIN, staff DEMO_STAFF_USERNAME) so clearDemo()
 * can remove it without touching real data. The visit pattern is the same every run for a given `now`
 * (seeded random); member and voucher codes are freshly generated.
 */
export const DEMO_EMAIL_DOMAIN = "demo.squarelounge.test";
export const DEMO_STAFF_USERNAME = "demo.counter";

const DAYS_OF_HISTORY = 60;
const MEMBERS = 40;
const MIN = 60_000;
const DAY = 86_400_000;
const IST_OFFSET_MIN = 330;
const OPEN_MIN = 11 * 60; // 11:00
const CLOSE_MIN = 28 * 60; // 04:00 next morning

/** Small seeded random generator (mulberry32), so demo data is the same every run. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rand: () => number, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) if ((r -= w) < 0) return item;
  return items[items.length - 1][0];
}

const pick = <T>(rand: () => number, items: readonly T[]) => items[Math.floor(rand() * items.length)];

/** An instant from a business date and minutes after its midnight (IST); 1500 = 01:00 the next morning. */
const at = (date: string, minutes: number) => new Date(Date.parse(`${date}T00:00:00Z`) + (minutes - IST_OFFSET_MIN) * MIN);
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

const AREAS = [
  ["Malakpet", "500036", 30],
  ["Old Malakpet", "500036", 7],
  ["Moosarambagh", "500036", 6],
  ["Dilsukhnagar", "500060", 15],
  ["Saidabad", "500059", 10],
  ["Santosh Nagar", "500059", 6],
  ["Chaderghat", "500024", 8],
  ["Amberpet", "500013", 8],
  ["LB Nagar", "500074", 6],
  ["Koti", "500095", 4],
] as const;

const FIRST_NAMES = [
  "Arjun", "Faizan", "Rahul", "Sana", "Imran", "Vikram", "Ayesha", "Karthik", "Zaid", "Priya",
  "Mohammed", "Sai", "Rehan", "Anjali", "Abdul", "Nikhil", "Fatima", "Rohit", "Sameer", "Divya",
  "Harsha", "Yusuf", "Teja", "Meera", "Adil", "Varun", "Hina", "Pranav", "Owais", "Sneha",
  "Kiran", "Arif", "Manoj", "Zoya", "Sohail", "Aditya", "Nida", "Ravi", "Tariq", "Lakshmi",
];
const LAST_NAMES = ["Reddy", "Khan", "Sharma", "Ali", "Rao", "Siddiqui", "Naidu", "Hussain", "Varma", "Qureshi", "Goud", "Ahmed"];
const GAMES = ["FC 25", "WWE 2K26", "Tekken 8", "GTA V", "Call of Duty", "Gran Turismo 7", "Mortal Kombat 1", "NBA 2K26", "Fortnite"];
const PAISE_PER_HOUR = { PS5: 15000, PS4: 10000 } as const;

export type DemoSummary = { gamers: number; visits: number; payments: number; offers: number; vouchers: number; playingNow: number };

/** Replaces any earlier demo data with a fresh set. `password` is shared by all demo accounts. */
export async function seedDemo({ password, now = new Date() }: { password: string; now?: Date }): Promise<DemoSummary> {
  if (password.length < 8) throw new Error("The demo password needs at least 8 characters.");
  await clearDemo();

  let stations = await db.select().from(schema.stations).where(eq(schema.stations.active, true));
  if (stations.length === 0) {
    await syncStations();
    stations = await db.select().from(schema.stations).where(eq(schema.stations.active, true));
  }

  const rand = rng(20261103);
  const passwordHash = await hashPassword(password);
  const today = businessDate(now);
  const firstDay = addDays(today, -DAYS_OF_HISTORY);
  const year = Number(today.slice(0, 4));

  // Counter staff for trying check-in/out (kept, deactivated, if clearDemo found it in real use).
  const [staffRow] = await db
    .insert(schema.staff)
    .values({ username: DEMO_STAFF_USERNAME, displayName: "Demo Counter", passwordHash, role: "staff" })
    .onConflictDoUpdate({ target: schema.staff.username, set: { active: true, passwordHash, updatedAt: sql`now()` } })
    .returning();

  // Members: join dates spread out; a few "lapsed" ones stop coming 3–6 weeks ago.
  const codes = new Set<string>();
  const members = Array.from({ length: MEMBERS }, (_, i) => {
    const [area, pincode] = weighted(rand, AREAS.map(([a, p, w]) => [[a, p] as const, w] as const));
    const birthYear = weighted(rand, [[year - 15, 6], [year - 17, 8], [year - 19, 14], [year - 21, 18], [year - 23, 16], [year - 26, 14], [year - 30, 10], [year - 36, 6]] as const);
    let memberCode = generateMemberCode();
    while (codes.has(memberCode)) memberCode = generateMemberCode();
    codes.add(memberCode);
    const joinedDay = Math.floor(rand() * (DAYS_OF_HISTORY - 5));
    return {
      id: randomUUID(),
      fullName: `${FIRST_NAMES[i]} ${pick(rand, LAST_NAMES)}`,
      email: `${FIRST_NAMES[i].toLowerCase()}.${i + 1}@${DEMO_EMAIL_DOMAIN}`,
      phone: `+919${String(Math.floor(rand() * 1e9)).padStart(9, "0")}`,
      memberCode,
      area,
      pincode,
      birthYear,
      gender: weighted(rand, [["male", 74], ["female", 21], ["prefer_not", 5]] as const),
      referralSource: weighted(rand, [["instagram", 35], ["friend", 30], ["google", 15], ["walk_in", 12], ["whatsapp", 6], ["other", 2]] as const),
      favouriteGames: [pick(rand, GAMES), pick(rand, GAMES)].filter((g, j, all) => all.indexOf(g) === j),
      marketingOptIn: rand() < 0.6,
      joinedDay,
      lastDay: i % 7 === 3 ? DAYS_OF_HISTORY - 22 - Math.floor(rand() * 20) : DAYS_OF_HISTORY,
      weight: 1 / Math.pow(i + 1, 0.7),
      createdAt: at(addDays(firstDay, joinedDay), OPEN_MIN + Math.floor(rand() * 600)),
    };
  });

  await db.insert(schema.gamers).values(
    members.map(({ id, fullName, email, phone, memberCode, area, pincode, birthYear, gender, referralSource, favouriteGames, marketingOptIn, createdAt }) => ({
      id, fullName, email, phone, memberCode, area, pincode, birthYear, gender, referralSource, favouriteGames, marketingOptIn,
      passwordHash, createdAt, updatedAt: createdAt,
    })),
  );
  await db.insert(schema.consents).values(
    members.flatMap((m) => [
      { gamerId: m.id, purpose: "service" as const, granted: true, noticeVersion: PRIVACY_NOTICE_VERSION, createdAt: m.createdAt },
      ...(m.marketingOptIn ? [{ gamerId: m.id, purpose: "marketing" as const, granted: true, noticeVersion: PRIVACY_NOTICE_VERSION, createdAt: m.createdAt }] : []),
      ...(year - m.birthYear <= 18 ? [{ gamerId: m.id, purpose: "guardian" as const, granted: true, noticeVersion: PRIVACY_NOTICE_VERSION, createdAt: m.createdAt }] : []),
    ]),
  );

  // Visits: one group per station at a time, nobody in two places at once, inside opening hours.
  type Busy = { start: number; end: number }[];
  const stationBusy = new Map<number, Busy>(stations.map((s) => [s.id, []]));
  const memberBusy = new Map<string, Busy>(members.map((m) => [m.id, []]));
  const free = (busy: Busy, start: number, end: number) => busy.every((b) => end <= b.start || start >= b.end);

  const sessions: (typeof schema.playSessions.$inferInsert)[] = [];
  const payments: (typeof schema.payments.$inferInsert)[] = [];
  const ledger: (typeof schema.pointsLedger.$inferInsert)[] = [];
  const startWeights = [
    [11, 1], [12, 1], [13, 1], [14, 1], [15, 2], [16, 2], [17, 3], [18, 4], [19, 5], [20, 5],
    [21, 5], [22, 4], [23, 3], [24, 3], [25, 2], [26, 1],
  ] as const;

  const nowMs = now.getTime();
  for (let d = 0; d <= DAYS_OF_HISTORY; d++) {
    const date = addDays(firstDay, d);
    const dow = weekday(date);
    const groups = dow === 0 || dow === 6 ? 10 + Math.floor(rand() * 5) : dow === 5 ? 8 + Math.floor(rand() * 4) : 4 + Math.floor(rand() * 4);
    const eligible = members.filter((m) => m.joinedDay <= d && m.lastDay >= d);

    for (let g = 0; g < groups && eligible.length > 0; g++) {
      const startMin = weighted(rand, startWeights) * 60 + (rand() < 0.5 ? 0 : 30);
      const length = weighted(rand, [[60, 25], [90, 20], [120, 25], [150, 10], [180, 12], [240, 8]] as const);
      const endMin = Math.min(startMin + length, CLOSE_MIN);
      const start = at(date, startMin).getTime();
      const end = at(date, endMin).getTime();
      if (end > nowMs) continue; // finished visits only; "playing now" is added below

      const size = weighted(rand, [[1, 35], [2, 35], [3, 15], [4, 10], [6, 5]] as const);
      const open = stations.filter((s) => s.maxCheckIns >= size && free(stationBusy.get(s.id)!, start, end));
      if (open.length === 0) continue;
      const station = pick(rand, open);

      const group: typeof members = [];
      for (let tries = 0; group.length < size && tries < 40; tries++) {
        const m = weighted(rand, eligible.map((x) => [x, x.weight] as const));
        if (!group.includes(m) && free(memberBusy.get(m.id)!, start, end)) group.push(m);
      }
      if (group.length === 0) continue;

      stationBusy.get(station.id)!.push({ start, end });
      const minutes = Math.round((end - start) / MIN);
      const unrecorded = rand() < 0.07;
      const paymentId = randomUUID();
      payments.push({
        id: paymentId,
        stationId: station.id,
        amountPaise: unrecorded ? null : Math.round((minutes / 60) * PAISE_PER_HOUR[station.console] * group.length),
        method: unrecorded ? null : weighted(rand, [["upi", 65], ["cash", 30], ["card", 5]] as const),
        recordedBy: staffRow.id,
        createdAt: new Date(end),
      });
      for (const m of group) {
        memberBusy.get(m.id)!.push({ start, end });
        const sessionId = randomUUID();
        sessions.push({
          id: sessionId, gamerId: m.id, stationId: station.id, status: "closed",
          startedAt: new Date(start), endedAt: new Date(end), startedBy: staffRow.id, endedBy: staffRow.id, paymentId,
          createdAt: new Date(start), updatedAt: new Date(end),
        });
        const points = pointsFor(minutes, station.console);
        if (points > 0) ledger.push({ gamerId: m.id, delta: points, reason: "session", sessionId, createdAt: new Date(end) });
      }
    }
  }

  // Members playing right now, if the lounge is open.
  const nowMin = Math.round((nowMs - at(today, 0).getTime()) / MIN);
  let playingNow = 0;
  for (const [ago, size] of [[95, 3], [40, 2]] as const) {
    const start = nowMs - ago * MIN;
    if (nowMin - ago < OPEN_MIN || nowMin >= CLOSE_MIN) continue;
    const station = stations.find((s) => s.maxCheckIns >= size && free(stationBusy.get(s.id)!, start, nowMs + 4 * 3_600_000));
    if (!station) continue;
    const group = members.filter((m) => m.lastDay >= DAYS_OF_HISTORY && free(memberBusy.get(m.id)!, start, nowMs + 4 * 3_600_000)).slice(0, size);
    stationBusy.get(station.id)!.push({ start, end: nowMs + 4 * 3_600_000 });
    for (const m of group) {
      memberBusy.get(m.id)!.push({ start, end: nowMs + 4 * 3_600_000 });
      sessions.push({ id: randomUUID(), gamerId: m.id, stationId: station.id, status: "open", startedAt: new Date(start), startedBy: staffRow.id, createdAt: new Date(start) });
      playingNow++;
    }
  }

  // Offers and vouchers: members sometimes spend points after a visit.
  const offerDefs = [
    { title: "Soft drink", description: "Any cold drink from the café.", pointsCost: 30, category: "cafe" as const },
    { title: "Snack combo", description: "Fries + a soft drink.", pointsCost: 60, category: "cafe" as const },
    { title: "Free PS4 hour", description: "One hour on any PS4 station.", pointsCost: 100, category: "gaming" as const },
    { title: "Free PS5 hour", description: "One hour on any PS5 station.", pointsCost: 150, category: "gaming" as const },
  ];
  const offers = offerDefs.map((o) => ({ ...o, id: randomUUID(), createdBy: staffRow.id, createdAt: at(firstDay, OPEN_MIN) }));
  const vouchers: (typeof schema.vouchers.$inferInsert)[] = [];
  const voucherCodes = new Set<string>();
  const voucherCode = () => {
    let code: string;
    do code = `V-${generateMemberCode().slice(3)}${pick(rand, ["2", "3", "4", "5", "6", "7", "8", "9"])}`;
    while (voucherCodes.has(code));
    voucherCodes.add(code);
    return code;
  };

  for (const m of members) {
    const earned = ledger.filter((l) => l.gamerId === m.id).sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
    let balance = 0;
    for (const entry of earned) {
      balance += entry.delta;
      const affordable = offers.filter((o) => o.pointsCost <= balance);
      if (affordable.length === 0 || rand() > 0.12) continue;
      const offer = rand() < 0.5 ? affordable[affordable.length - 1] : affordable[0];
      const claimedAt = new Date(entry.createdAt!.getTime() + Math.floor(rand() * 2 * DAY));
      if (claimedAt.getTime() >= nowMs) continue;
      const expiresAt = new Date(claimedAt.getTime() + loyalty.voucherDays * DAY);
      const id = randomUUID();
      const usedAt = new Date(claimedAt.getTime() + Math.floor(rand() * 4 * DAY));
      const status = expiresAt.getTime() <= nowMs ? (rand() < 0.75 ? "used" : "expired") : usedAt.getTime() < nowMs && rand() < 0.6 ? "used" : "active";
      vouchers.push({
        id, code: voucherCode(), gamerId: m.id, offerId: offer.id, pointsSpent: offer.pointsCost, status, expiresAt,
        usedAt: status === "used" ? usedAt : null, usedBy: status === "used" ? staffRow.id : null, createdAt: claimedAt, updatedAt: claimedAt,
      });
      ledger.push({ gamerId: m.id, delta: -offer.pointsCost, reason: "redemption", voucherId: id, createdAt: claimedAt });
      balance -= offer.pointsCost;
      if (status === "expired") {
        ledger.push({ gamerId: m.id, delta: offer.pointsCost, reason: "refund", voucherId: id, note: "voucher expired", createdAt: expiresAt });
        balance += offer.pointsCost;
      }
    }
  }

  const chunks = <T>(rows: T[], size = 400) => Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, (i + 1) * size));
  await db.transaction(async (tx) => {
    for (const rows of chunks(payments)) await tx.insert(schema.payments).values(rows);
    for (const rows of chunks(sessions)) await tx.insert(schema.playSessions).values(rows);
    await tx.insert(schema.offers).values(offers);
    for (const rows of chunks(vouchers)) await tx.insert(schema.vouchers).values(rows);
    for (const rows of chunks(ledger)) await tx.insert(schema.pointsLedger).values(rows);
  });

  return {
    gamers: members.length,
    visits: sessions.filter((s) => s.status === "closed").length,
    payments: payments.length,
    offers: offers.length,
    vouchers: vouchers.length,
    playingNow,
  };
}

/**
 * Removes everything the demo created. Real members are never touched. If the demo counter account
 * was used for real visits or offers, those stay and the account is only deactivated.
 */
export async function clearDemo(): Promise<void> {
  await db.transaction(async (tx) => {
    const demoGamers = sql`(select id from gamers where email like ${`%@${DEMO_EMAIL_DOMAIN}`})`;
    const demoStaff = sql`(select id from staff where username = ${DEMO_STAFF_USERNAME})`;

    await tx.execute(sql`delete from points_ledger where gamer_id in ${demoGamers}`);
    await tx.execute(sql`delete from vouchers where gamer_id in ${demoGamers}`);
    await tx.execute(sql`delete from play_sessions where gamer_id in ${demoGamers}`);
    await tx.execute(sql`delete from payments p where p.recorded_by in ${demoStaff}
      and not exists (select 1 from play_sessions s where s.payment_id = p.id)`);
    await tx.execute(sql`delete from offers o where o.created_by in ${demoStaff}
      and not exists (select 1 from vouchers v where v.offer_id = o.id)`);
    await tx.execute(sql`update offers set active = false where created_by in ${demoStaff}`);
    await tx.execute(sql`delete from login_attempts where identifier like ${`%@${DEMO_EMAIL_DOMAIN}`} or identifier = ${DEMO_STAFF_USERNAME}`);
    await tx.execute(sql`delete from gamers where id in ${demoGamers}`);

    const [inUse] = await tx.execute<{ used: boolean }>(sql`
      select exists (select 1 from play_sessions where started_by in ${demoStaff} or ended_by in ${demoStaff})
        or exists (select 1 from payments where recorded_by in ${demoStaff})
        or exists (select 1 from offers where created_by in ${demoStaff})
        or exists (select 1 from vouchers where used_by in ${demoStaff})
        or exists (select 1 from points_ledger where actor_staff_id in ${demoStaff}) as "used"`);
    if (inUse?.used) {
      await tx.execute(sql`delete from auth_sessions where staff_id in ${demoStaff}`);
      await tx.execute(sql`update staff set active = false where username = ${DEMO_STAFF_USERNAME}`);
    } else {
      await tx.execute(sql`delete from staff where username = ${DEMO_STAFF_USERNAME}`);
    }
  });
}
