import { sql } from "drizzle-orm";
import {
  bigserial,
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
import { playSessions } from "./sessions";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const offerCategoryEnum = pgEnum("offer_category", ["gaming", "cafe", "other"]);
export const voucherStatusEnum = pgEnum("voucher_status", ["active", "used", "expired", "cancelled"]);
export const ledgerReasonEnum = pgEnum("ledger_reason", ["session", "correction", "redemption", "refund", "adjustment"]);

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    pointsCost: integer("points_cost").notNull(),
    category: offerCategoryEnum("category").notNull().default("other"),
    /** Total vouchers allowed (null = unlimited). Cancelled/expired vouchers give stock back. */
    stock: integer("stock"),
    maxPerGamer: integer("max_per_gamer"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => staff.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("offers_cost_positive", sql`${t.pointsCost} > 0`),
    check("offers_stock_non_negative", sql`${t.stock} is null or ${t.stock} >= 0`),
    check("offers_max_per_gamer_positive", sql`${t.maxPerGamer} is null or ${t.maxPerGamer} > 0`),
    check("offers_dates_order", sql`${t.startsAt} is null or ${t.endsAt} is null or ${t.endsAt} > ${t.startsAt}`),
  ],
);

export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    gamerId: uuid("gamer_id")
      .notNull()
      .references(() => gamers.id),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id),
    pointsSpent: integer("points_spent").notNull(),
    status: voucherStatusEnum("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedBy: uuid("used_by").references(() => staff.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("vouchers_gamer_idx").on(t.gamerId),
    index("vouchers_offer_status_idx").on(t.offerId, t.status),
    index("vouchers_status_expiry_idx").on(t.status, t.expiresAt),
  ],
);

/** Every change to a member's points. Balance = sum(delta); rows are never edited or deleted. */
export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    gamerId: uuid("gamer_id")
      .notNull()
      .references(() => gamers.id),
    delta: integer("delta").notNull(),
    reason: ledgerReasonEnum("reason").notNull(),
    sessionId: uuid("session_id").references(() => playSessions.id),
    voucherId: uuid("voucher_id").references(() => vouchers.id),
    note: text("note"),
    actorStaffId: uuid("actor_staff_id").references(() => staff.id),
    createdAt: createdAt(),
  },
  (t) => [
    check("points_ledger_delta_non_zero", sql`${t.delta} <> 0`),
    uniqueIndex("points_ledger_one_award_per_session").on(t.sessionId).where(sql`${t.reason} = 'session'`),
    index("points_ledger_gamer_created_idx").on(t.gamerId, t.createdAt),
  ],
);

export type Offer = typeof offers.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type LedgerRow = typeof pointsLedger.$inferSelect;
