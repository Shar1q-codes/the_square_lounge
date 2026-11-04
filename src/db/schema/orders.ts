import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { gamers, staff } from "./identity";
import { playSessions, stations } from "./sessions";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const cafeOrderStatusEnum = pgEnum("cafe_order_status", ["new", "preparing", "delivered", "cancelled"]);

/**
 * A café order placed by a checked-in gamer, delivered to their station. Amounts in paise.
 * Paid at the counter with the gaming time; the website takes no payment.
 */
export const cafeOrders = pgTable(
  "cafe_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gamerId: uuid("gamer_id")
      .notNull()
      .references(() => gamers.id),
    stationId: integer("station_id")
      .notNull()
      .references(() => stations.id),
    /** The play session the gamer was in when ordering (proves they were at the station). */
    sessionId: uuid("session_id")
      .notNull()
      .references(() => playSessions.id),
    status: cafeOrderStatusEnum("status").notNull().default("new"),
    totalPaise: integer("total_paise").notNull(),
    note: text("note"),
    /** The staff member who last moved it on (preparing, delivered or cancelled). */
    handledBy: uuid("handled_by").references(() => staff.id),
    /** True when the gamer cancelled it themselves before the kitchen started. */
    cancelledByGamer: boolean("cancelled_by_gamer").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("cafe_orders_total_positive", sql`${t.totalPaise} > 0`),
    check("cafe_orders_note_length", sql`${t.note} is null or char_length(${t.note}) <= 200`),
    index("cafe_orders_status_created_idx").on(t.status, t.createdAt),
    index("cafe_orders_gamer_idx").on(t.gamerId, t.createdAt),
  ],
);

export const cafeOrderItems = pgTable(
  "cafe_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => cafeOrders.id, { onDelete: "cascade" }),
    /** Menu ids from src/config/menu.ts; name, option and price are copies from when it was ordered. */
    itemId: text("item_id").notNull(),
    optionId: text("option_id").notNull(),
    name: text("name").notNull(),
    option: text("option"),
    unitPricePaise: integer("unit_price_paise").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    check("cafe_order_items_quantity_range", sql`${t.quantity} between 1 and 20`),
    check("cafe_order_items_price_positive", sql`${t.unitPricePaise} > 0`),
    index("cafe_order_items_order_idx").on(t.orderId),
  ],
);

export type CafeOrder = typeof cafeOrders.$inferSelect;
export type CafeOrderItem = typeof cafeOrderItems.$inferSelect;
