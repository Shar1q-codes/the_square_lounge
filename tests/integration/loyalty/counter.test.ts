import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { deleteGamerAccount, exportGamerData } from "@/server/identity/consent";
import { adjustPoints } from "@/server/loyalty/adjust";
import { isCronAuthorized } from "@/server/loyalty/cron";
import { addLedgerEntry, balanceOf } from "@/server/loyalty/ledger";
import { createOffer } from "@/server/loyalty/offers";
import { claimOffer, findVoucherForCounter, redeemVoucher } from "@/server/loyalty/vouchers";
import { insertGamer, insertStaff, resetDb } from "../../support/db";

beforeEach(resetDb);

async function claimedVoucher() {
  const admin = await insertStaff({ role: "admin" });
  const gamer = await insertGamer({ fullName: "Voucher Holder", memberCode: "SQ-HHHHH" });
  await addLedgerEntry(db, { gamerId: gamer.id, delta: 100, reason: "adjustment" });
  const offerId = await createOffer(admin.id, {
    title: "Soft drink",
    description: "",
    pointsCost: 100,
    category: "cafe",
    stock: null,
    maxPerGamer: null,
    startsAt: null,
    endsAt: null,
    active: true,
  });
  const claim = await claimOffer(gamer.id, offerId);
  if (!claim.ok) throw new Error("claim failed");
  return { admin, gamer, ...claim };
}

describe("counter redemption", () => {
  it("finds a voucher by a loosely typed code with who it belongs to", async () => {
    const { code } = await claimedVoucher();

    expect(await findVoucherForCounter(code.toLowerCase().replace("-", " "))).toMatchObject({
      code,
      status: "active",
      offerTitle: "Soft drink",
      gamerName: "Voucher Holder",
      memberCode: "SQ-HHHHH",
    });
  });

  it("returns null for an unknown code", async () => {
    expect(await findVoucherForCounter("V-ZZZZZZ")).toBeNull();
  });

  it("marks a voucher used once, and audits it", async () => {
    const { admin, voucherId } = await claimedVoucher();

    expect(await redeemVoucher(admin.id, voucherId)).toEqual({ ok: true });
    expect(await redeemVoucher(admin.id, voucherId)).toEqual({ ok: false, status: "used" });
    const [voucher] = await db.select().from(schema.vouchers);
    expect(voucher).toMatchObject({ status: "used", usedBy: admin.id });
    expect((await db.select().from(schema.auditLog)).map((a) => a.action)).toContain("voucher.redeem");
  });

  it("won't redeem an expired voucher, and refunds it", async () => {
    const { admin, gamer, voucherId, code } = await claimedVoucher();
    await db.update(schema.vouchers).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(schema.vouchers.id, voucherId));

    expect((await findVoucherForCounter(code))?.status).toBe("expired");
    expect(await redeemVoucher(admin.id, voucherId)).toEqual({ ok: false, status: "expired" });
    expect(await balanceOf(gamer.id)).toBe(100);
  });
});

describe("adjustPoints", () => {
  it("adds or removes points with a reason and audits it", async () => {
    const admin = await insertStaff({ role: "admin" });
    const gamer = await insertGamer();

    expect(await adjustPoints(admin.id, gamer.id, 50, "Birthday gift")).toEqual({ ok: true, balance: 50 });
    expect(await adjustPoints(admin.id, gamer.id, -20, "Duplicate visit")).toEqual({ ok: true, balance: 30 });
    const audit = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "points.adjust"));
    expect(audit.map((a) => a.details)).toEqual([
      { points: 50, reason: "Birthday gift" },
      { points: -20, reason: "Duplicate visit" },
    ]);
  });

  it("refuses deleted accounts", async () => {
    const admin = await insertStaff({ role: "admin" });
    const gamer = await insertGamer({ deletedAt: new Date(), email: null });

    expect(await adjustPoints(admin.id, gamer.id, 50, "Gift")).toEqual({ ok: false, reason: "gamer_not_found" });
  });
});

describe("cron authorisation", () => {
  it("needs the exact bearer secret, and a configured secret", () => {
    expect(isCronAuthorized("Bearer s3cret-value", "s3cret-value")).toBe(true);
    expect(isCronAuthorized("Bearer wrong", "s3cret-value")).toBe(false);
    expect(isCronAuthorized(null, "s3cret-value")).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized("Bearer undefined", undefined)).toBe(false);
  });
});

describe("privacy", () => {
  it("exports the points history and vouchers", async () => {
    const { gamer, code } = await claimedVoucher();
    const data = await exportGamerData(gamer.id);

    expect(data.points.map((p) => p.delta)).toEqual([100, -100]);
    expect(data.vouchers).toEqual([expect.objectContaining({ code, offer: "Soft drink", status: "active" })]);
  });

  it("cancels active vouchers when the account is deleted", async () => {
    const { gamer, code } = await claimedVoucher();
    await deleteGamerAccount(gamer.id, "gamer-password");

    expect((await findVoucherForCounter(code))?.status).toBe("cancelled");
  });
});
