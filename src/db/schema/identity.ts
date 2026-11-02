import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const genderEnum = pgEnum("gender", ["male", "female", "other", "prefer_not"]);
export const referralSourceEnum = pgEnum("referral_source", [
  "instagram",
  "google",
  "friend",
  "walk_in",
  "whatsapp",
  "other",
]);
export const staffRoleEnum = pgEnum("staff_role", ["staff", "admin"]);
export const consentPurposeEnum = pgEnum("consent_purpose", ["service", "marketing", "guardian"]);
export const loginKindEnum = pgEnum("login_kind", ["gamer", "staff"]);

/** Personal fields are nulled (not the row deleted) when a gamer deletes their account. */
export const gamers = pgTable(
  "gamers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberCode: text("member_code").notNull().unique(),
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    fullName: text("full_name"),
    /** Contact only: never used to log in, not unique. Stored as +91XXXXXXXXXX. */
    phone: text("phone"),
    birthYear: integer("birth_year"),
    gender: genderEnum("gender"),
    area: text("area").notNull(),
    pincode: char("pincode", { length: 6 }).notNull(),
    referralSource: referralSourceEnum("referral_source").notNull(),
    favouriteGames: text("favourite_games").array().notNull().default(sql`'{}'::text[]`),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("gamers_phone_idx").on(t.phone), index("gamers_pincode_idx").on(t.pincode)],
);

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: staffRoleEnum("role").notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Append-only: a change of mind is a new row, so the history stays provable. */
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gamerId: uuid("gamer_id")
      .notNull()
      .references(() => gamers.id, { onDelete: "cascade" }),
    purpose: consentPurposeEnum("purpose").notNull(),
    granted: boolean("granted").notNull(),
    noticeVersion: text("notice_version").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("consents_gamer_idx").on(t.gamerId)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull().unique(),
    gamerId: uuid("gamer_id").references(() => gamers.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").references(() => staff.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check("auth_sessions_one_subject", sql`num_nonnulls(${t.gamerId}, ${t.staffId}) = 1`),
    index("auth_sessions_gamer_idx").on(t.gamerId),
    index("auth_sessions_staff_idx").on(t.staffId),
  ],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    kind: loginKindEnum("kind").notNull(),
    identifier: text("identifier").notNull(),
    succeeded: boolean("succeeded").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("login_attempts_lookup_idx").on(t.kind, t.identifier, t.createdAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorStaffId: uuid("actor_staff_id").references(() => staff.id, { onDelete: "set null" }),
    actorGamerId: uuid("actor_gamer_id").references(() => gamers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

export type Gamer = typeof gamers.$inferSelect;
export type Staff = typeof staff.$inferSelect;
