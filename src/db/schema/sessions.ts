import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { gamers, staff } from "./identity";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const consoleEnum = pgEnum("console", ["PS5", "PS4"]);
export const sessionStatusEnum = pgEnum("session_status", ["open", "closed", "voided"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "upi", "card", "other"]);

/** Copied from src/config/site.ts by `npm run db:seed`; ids match the site's station ids. */
export const stations = pgTable(
  "stations",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    console: consoleEnum("console").notNull(),
    maxCheckIns: integer("max_check_ins").notNull().default(8),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("stations_max_check_ins_range", sql`${t.maxCheckIns} between 1 and 12`)],
);

/** One per check-out (a single member or a whole station). Amounts in paise. */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stationId: integer("station_id")
      .notNull()
      .references(() => stations.id),
    amountPaise: integer("amount_paise"),
    method: paymentMethodEnum("method"),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => staff.id),
    createdAt: createdAt(),
  },
  (t) => [
    check("payments_amount_non_negative", sql`${t.amountPaise} is null or ${t.amountPaise} >= 0`),
    index("payments_created_idx").on(t.createdAt),
  ],
);

export const playSessions = pgTable(
  "play_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gamerId: uuid("gamer_id")
      .notNull()
      .references(() => gamers.id),
    stationId: integer("station_id")
      .notNull()
      .references(() => stations.id),
    status: sessionStatusEnum("status").notNull().default("open"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    startedBy: uuid("started_by")
      .notNull()
      .references(() => staff.id),
    endedBy: uuid("ended_by").references(() => staff.id),
    paymentId: uuid("payment_id").references(() => payments.id),
    voidReason: text("void_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("play_sessions_one_open_per_gamer").on(t.gamerId).where(sql`${t.status} = 'open'`),
    check("play_sessions_open_has_no_end", sql`(${t.status} = 'open') = (${t.endedAt} is null)`),
    check("play_sessions_end_after_start", sql`${t.endedAt} is null or ${t.endedAt} > ${t.startedAt}`),
    index("play_sessions_station_status_idx").on(t.stationId, t.status),
    index("play_sessions_gamer_idx").on(t.gamerId),
    index("play_sessions_started_idx").on(t.startedAt),
  ],
);

export type Station = typeof stations.$inferSelect;
export type PlaySession = typeof playSessions.$inferSelect;
