import { describe, expect, it } from "vitest";
import { cafe, menuItems } from "@/config/menu";
import { afterLogin } from "@/lib/forms";
import { canMoveOrder, ORDER_LIMITS, priceCart, rupees } from "@/lib/orders";

describe("menu", () => {
  it("has unique item ids and positive prices", () => {
    const ids = cafe.categories.flatMap((c) => c.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(menuItems.size).toBe(ids.length);
    for (const item of menuItems.values()) {
      expect(item.options.length).toBeGreaterThan(0);
      for (const o of item.options) expect(o.price).toBeGreaterThan(0);
    }
  });
});

describe("priceCart", () => {
  it("prices from the menu and adds up the total", () => {
    const result = priceCart([
      { itemId: "salted-fries", optionId: "large", quantity: 2 },
      { itemId: "zinger-burger", optionId: "regular", quantity: 1 },
    ]);
    expect(result).toMatchObject({ ok: true, total: 2 * 100 + 130 });
    if (result.ok) expect(result.lines[0]).toMatchObject({ name: "Salted Fries", option: "Large", unitPrice: 100 });
  });

  it("merges repeated lines and keeps item notes in the name", () => {
    const result = priceCart([
      { itemId: "broasted-5", optionId: "regular", quantity: 1 },
      { itemId: "broasted-5", optionId: "regular", quantity: 2 },
    ]);
    expect(result).toMatchObject({ ok: true, total: 3 * 350 });
    if (result.ok) {
      expect(result.lines).toEqual([expect.objectContaining({ name: "Broasted Chicken (5 pieces)", option: null, quantity: 3 })]);
    }
  });

  it("refuses empty carts, unknown items or options, and bad quantities", () => {
    expect(priceCart([])).toEqual({ ok: false, reason: "empty" });
    expect(priceCart([{ itemId: "caviar", optionId: "regular", quantity: 1 }])).toEqual({ ok: false, reason: "unknown_item" });
    expect(priceCart([{ itemId: "salted-fries", optionId: "huge", quantity: 1 }])).toEqual({ ok: false, reason: "unknown_item" });
    expect(priceCart([{ itemId: "salted-fries", optionId: "small", quantity: 0 }])).toEqual({ ok: false, reason: "bad_quantity" });
    expect(priceCart([{ itemId: "salted-fries", optionId: "small", quantity: 1.5 }])).toEqual({ ok: false, reason: "bad_quantity" });
    expect(
      priceCart([
        { itemId: "salted-fries", optionId: "small", quantity: ORDER_LIMITS.quantity },
        { itemId: "salted-fries", optionId: "small", quantity: 1 },
      ]),
    ).toEqual({ ok: false, reason: "bad_quantity" });
  });

  it("caps how many different lines one order can have", () => {
    const all = [...menuItems.values()].flatMap((i) => i.options.map((o) => ({ itemId: i.id, optionId: o.id, quantity: 1 })));
    expect(all.length).toBeGreaterThan(ORDER_LIMITS.lines);
    expect(priceCart(all)).toEqual({ ok: false, reason: "too_many_lines" });
  });
});

describe("order status", () => {
  it("only moves forward, and finished orders stay finished", () => {
    expect(canMoveOrder("new", "preparing")).toBe(true);
    expect(canMoveOrder("preparing", "delivered")).toBe(true);
    expect(canMoveOrder("preparing", "new")).toBe(false);
    expect(canMoveOrder("delivered", "cancelled")).toBe(false);
    expect(canMoveOrder("cancelled", "preparing")).toBe(false);
  });

  it("formats rupees the Indian way", () => {
    expect(rupees(1240)).toBe("₹1,240");
  });
});

describe("afterLogin", () => {
  it("returns only to our own pages", () => {
    expect(afterLogin("/order")).toBe("/order");
    expect(afterLogin("https://evil.example")).toBe("/account");
    expect(afterLogin("//evil.example")).toBe("/account");
    expect(afterLogin(null)).toBe("/account");
  });
});
