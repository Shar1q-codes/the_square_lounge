import "server-only";
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { canMoveOrder, OPEN_STATUSES, ORDER_LIMITS, priceCart, type CartLine, type OrderStatus } from "@/lib/orders";
import { writeAudit } from "@/server/identity/audit";

export type PlaceOrderResult =
  | { ok: true; orderId: string; stationName: string; total: number }
  | { ok: false; reason: "not_checked_in" | "too_many_open" | "empty" | "too_many_lines" | "unknown_item" | "bad_quantity" };

/**
 * Places an order for the station the gamer is checked in to. Only checked-in gamers can order,
 * so nobody can send food to the lounge from home. Prices come from the menu, never the browser.
 */
export async function placeOrder(gamerId: string, cart: CartLine[], note?: string): Promise<PlaceOrderResult> {
  const priced = priceCart(cart);
  if (!priced.ok) return priced;
  const cleanNote = note?.trim().slice(0, ORDER_LIMITS.noteLength) || null;

  return db.transaction(async (tx) => {
    // Lock the open session so two quick taps can't both slip past the open-orders limit.
    const [session] = await tx
      .select({ id: schema.playSessions.id, stationId: schema.playSessions.stationId, stationName: schema.stations.name })
      .from(schema.playSessions)
      .innerJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
      .where(and(eq(schema.playSessions.gamerId, gamerId), eq(schema.playSessions.status, "open")))
      .for("update", { of: schema.playSessions });
    if (!session) return { ok: false, reason: "not_checked_in" } as const;

    const [{ open }] = await tx
      .select({ open: count() })
      .from(schema.cafeOrders)
      .where(and(eq(schema.cafeOrders.gamerId, gamerId), inArray(schema.cafeOrders.status, [...OPEN_STATUSES])));
    if (open >= ORDER_LIMITS.openOrders) return { ok: false, reason: "too_many_open" } as const;

    const [order] = await tx
      .insert(schema.cafeOrders)
      .values({
        gamerId,
        stationId: session.stationId,
        sessionId: session.id,
        totalPaise: priced.total * 100,
        note: cleanNote,
      })
      .returning({ id: schema.cafeOrders.id });
    await tx.insert(schema.cafeOrderItems).values(
      priced.lines.map((l) => ({
        orderId: order.id,
        itemId: l.itemId,
        optionId: l.optionId,
        name: l.name,
        option: l.option,
        unitPricePaise: l.unitPrice * 100,
        quantity: l.quantity,
      })),
    );
    return { ok: true, orderId: order.id, stationName: session.stationName, total: priced.total } as const;
  });
}

export type OrderLine = { name: string; option: string | null; quantity: number; unitPrice: number };
export type OrderView = {
  id: string;
  status: OrderStatus;
  stationId: number;
  stationName: string;
  total: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledByGamer: boolean;
  lines: OrderLine[];
};
export type CounterOrder = OrderView & { gamerName: string | null; memberCode: string };

async function linesFor(orderIds: string[]): Promise<Map<string, OrderLine[]>> {
  const byOrder = new Map<string, OrderLine[]>();
  if (orderIds.length === 0) return byOrder;
  const rows = await db
    .select()
    .from(schema.cafeOrderItems)
    .where(inArray(schema.cafeOrderItems.orderId, orderIds))
    .orderBy(asc(schema.cafeOrderItems.name));
  for (const r of rows) {
    const list = byOrder.get(r.orderId) ?? [];
    list.push({ name: r.name, option: r.option, quantity: r.quantity, unitPrice: r.unitPricePaise / 100 });
    byOrder.set(r.orderId, list);
  }
  return byOrder;
}

const orderColumns = {
  id: schema.cafeOrders.id,
  status: schema.cafeOrders.status,
  stationId: schema.cafeOrders.stationId,
  stationName: schema.stations.name,
  totalPaise: schema.cafeOrders.totalPaise,
  note: schema.cafeOrders.note,
  createdAt: schema.cafeOrders.createdAt,
  updatedAt: schema.cafeOrders.updatedAt,
  cancelledByGamer: schema.cafeOrders.cancelledByGamer,
};

/** The gamer's orders from today's visit (the last 18 hours), newest first. */
export async function ordersForGamer(gamerId: string): Promise<OrderView[]> {
  const rows = await db
    .select(orderColumns)
    .from(schema.cafeOrders)
    .innerJoin(schema.stations, eq(schema.stations.id, schema.cafeOrders.stationId))
    .where(and(eq(schema.cafeOrders.gamerId, gamerId), gte(schema.cafeOrders.createdAt, sql`now() - interval '18 hours'`)))
    .orderBy(desc(schema.cafeOrders.createdAt))
    .limit(20);
  const lines = await linesFor(rows.map((r) => r.id));
  return rows.map(({ totalPaise, ...r }) => ({ ...r, total: totalPaise / 100, lines: lines.get(r.id) ?? [] }));
}

/** The gamer cancels their own order, only while the kitchen hasn't started it. */
export async function cancelOwnOrder(gamerId: string, orderId: string): Promise<{ ok: boolean }> {
  const updated = await db
    .update(schema.cafeOrders)
    .set({ status: "cancelled", cancelledByGamer: true, updatedAt: new Date() })
    .where(and(eq(schema.cafeOrders.id, orderId), eq(schema.cafeOrders.gamerId, gamerId), eq(schema.cafeOrders.status, "new")))
    .returning({ id: schema.cafeOrders.id });
  return { ok: updated.length > 0 };
}

/** For the counter: every open order, oldest first, plus the last few finished ones. */
export async function counterOrders(): Promise<{ open: CounterOrder[]; recent: CounterOrder[] }> {
  const select = () =>
    db
      .select({ ...orderColumns, gamerName: schema.gamers.fullName, memberCode: schema.gamers.memberCode })
      .from(schema.cafeOrders)
      .innerJoin(schema.stations, eq(schema.stations.id, schema.cafeOrders.stationId))
      .innerJoin(schema.gamers, eq(schema.gamers.id, schema.cafeOrders.gamerId));
  const [open, recent] = await Promise.all([
    select()
      .where(inArray(schema.cafeOrders.status, [...OPEN_STATUSES]))
      .orderBy(asc(schema.cafeOrders.createdAt)),
    select()
      .where(
        and(
          inArray(schema.cafeOrders.status, ["delivered", "cancelled"]),
          gte(schema.cafeOrders.updatedAt, sql`now() - interval '12 hours'`),
        ),
      )
      .orderBy(desc(schema.cafeOrders.updatedAt))
      .limit(15),
  ]);
  const lines = await linesFor([...open, ...recent].map((r) => r.id));
  const view = ({ totalPaise, ...r }: (typeof open)[number]): CounterOrder => ({
    ...r,
    total: totalPaise / 100,
    lines: lines.get(r.id) ?? [],
  });
  return { open: open.map(view), recent: recent.map(view) };
}

/** What the staff buzzer polls: how many orders wait, and the newest one's id. */
export async function newOrdersSummary(): Promise<{ waiting: number; latestId: string | null }> {
  const [row] = await db
    .select({
      waiting: count(),
      latestId: sql<string | null>`(array_agg(${schema.cafeOrders.id} order by ${schema.cafeOrders.createdAt} desc))[1]`,
    })
    .from(schema.cafeOrders)
    .where(eq(schema.cafeOrders.status, "new"));
  return { waiting: row?.waiting ?? 0, latestId: row?.latestId ?? null };
}

export type MoveResult = { ok: true } | { ok: false; reason: "not_found" | "not_allowed"; status?: OrderStatus };

/** Staff move an order on: preparing, delivered or cancelled. */
export async function moveOrder(staffId: string, orderId: string, to: OrderStatus): Promise<MoveResult> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select({ status: schema.cafeOrders.status })
      .from(schema.cafeOrders)
      .where(eq(schema.cafeOrders.id, orderId))
      .for("update");
    if (!order) return { ok: false, reason: "not_found" } as const;
    if (!canMoveOrder(order.status, to)) return { ok: false, reason: "not_allowed", status: order.status } as const;
    await tx
      .update(schema.cafeOrders)
      .set({ status: to, handledBy: staffId, updatedAt: new Date() })
      .where(eq(schema.cafeOrders.id, orderId));
    await writeAudit(
      { actorStaffId: staffId, action: `cafe_order.${to}`, targetType: "cafe_order", targetId: orderId, details: { from: order.status } },
      tx,
    );
    return { ok: true } as const;
  });
}

/** Every order for "Download my data". */
export async function ordersForExport(gamerId: string) {
  const rows = await db
    .select({ ...orderColumns })
    .from(schema.cafeOrders)
    .innerJoin(schema.stations, eq(schema.stations.id, schema.cafeOrders.stationId))
    .where(eq(schema.cafeOrders.gamerId, gamerId))
    .orderBy(asc(schema.cafeOrders.createdAt));
  const lines = await linesFor(rows.map((r) => r.id));
  return rows.map(({ id, totalPaise, stationName, status, note, createdAt }) => ({
    station: stationName,
    status,
    total: totalPaise / 100,
    note,
    at: createdAt,
    items: lines.get(id) ?? [],
  }));
}
