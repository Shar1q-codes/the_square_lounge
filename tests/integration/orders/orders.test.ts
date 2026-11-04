import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { exportGamerData } from "@/server/identity/consent";
import { checkIn } from "@/server/sessions/checkIn";
import { closeSessions } from "@/server/sessions/checkOut";
import { cancelOwnOrder, counterOrders, moveOrder, newOrdersSummary, ordersForGamer, placeOrder } from "@/server/orders/orders";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

const fries = { itemId: "salted-fries", optionId: "small", quantity: 2 };

async function seated() {
  const member = await insertStaff();
  const station = await insertStation({ id: 2, name: "Station 02" });
  const gamer = await insertGamer({ fullName: "Hungry Gamer" });
  const session = await checkIn(member.id, gamer.id, station.id);
  if (!session.ok) throw new Error("check-in failed");
  return { member, station, gamer, sessionId: session.sessionId };
}

describe("placeOrder", () => {
  it("sends the order to the station the gamer is checked in to, priced from the menu", async () => {
    const { gamer, sessionId } = await seated();
    const result = await placeOrder(gamer.id, [fries], "  extra salt  ");
    expect(result).toMatchObject({ ok: true, stationName: "Station 02", total: 140 });

    const [order] = await db.select().from(schema.cafeOrders);
    expect(order).toMatchObject({ stationId: 2, sessionId, status: "new", totalPaise: 14_000, note: "extra salt" });
    const items = await db.select().from(schema.cafeOrderItems);
    expect(items).toEqual([expect.objectContaining({ name: "Salted Fries", option: "Small", unitPricePaise: 7000, quantity: 2 })]);
  });

  it("refuses gamers who are not checked in, including after check-out", async () => {
    const outsider = await insertGamer();
    expect(await placeOrder(outsider.id, [fries])).toEqual({ ok: false, reason: "not_checked_in" });

    const { member, gamer, sessionId } = await seated();
    await db.update(schema.playSessions).set({ startedAt: new Date(Date.now() - 600_000) });
    await closeSessions(member.id, { sessionId }, { amountPaise: null, method: null });
    expect(await placeOrder(gamer.id, [fries])).toEqual({ ok: false, reason: "not_checked_in" });
    expect(await db.select().from(schema.cafeOrders)).toHaveLength(0);
  });

  it("limits how many orders can be on the way at once", async () => {
    const { gamer } = await seated();
    for (let i = 0; i < 5; i++) expect((await placeOrder(gamer.id, [fries])).ok).toBe(true);
    expect(await placeOrder(gamer.id, [fries])).toEqual({ ok: false, reason: "too_many_open" });
  });
});

describe("following an order", () => {
  it("shows up for staff and the buzzer, moves forward, and the gamer sees each step", async () => {
    const { member, gamer } = await seated();
    const placed = await placeOrder(gamer.id, [fries]);
    if (!placed.ok) throw new Error("order failed");

    expect(await newOrdersSummary()).toEqual({ waiting: 1, latestId: placed.orderId });
    const counter = await counterOrders();
    expect(counter.open).toEqual([expect.objectContaining({ id: placed.orderId, gamerName: "Hungry Gamer", total: 140 })]);

    expect(await moveOrder(member.id, placed.orderId, "preparing")).toEqual({ ok: true });
    expect((await newOrdersSummary()).waiting).toBe(0);
    expect(await moveOrder(member.id, placed.orderId, "delivered")).toEqual({ ok: true });
    expect(await moveOrder(member.id, placed.orderId, "preparing")).toMatchObject({ ok: false, reason: "not_allowed" });

    const [mine] = await ordersForGamer(gamer.id);
    expect(mine).toMatchObject({ status: "delivered", lines: [expect.objectContaining({ quantity: 2 })] });
    expect((await counterOrders()).recent).toHaveLength(1);
  });

  it("lets the gamer cancel only their own order, and only before the kitchen starts", async () => {
    const { member, gamer } = await seated();
    const other = await insertGamer();
    const first = await placeOrder(gamer.id, [fries]);
    const second = await placeOrder(gamer.id, [fries]);
    if (!first.ok || !second.ok) throw new Error("order failed");

    expect(await cancelOwnOrder(other.id, first.orderId)).toEqual({ ok: false });
    expect(await cancelOwnOrder(gamer.id, first.orderId)).toEqual({ ok: true });
    await moveOrder(member.id, second.orderId, "preparing");
    expect(await cancelOwnOrder(gamer.id, second.orderId)).toEqual({ ok: false });
  });

  it("includes orders in Download my data", async () => {
    const { gamer } = await seated();
    await placeOrder(gamer.id, [fries]);
    const data = await exportGamerData(gamer.id);
    expect(data.cafeOrders).toEqual([expect.objectContaining({ station: "Station 02", total: 140 })]);
  });
});
