import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { E2E_ADMIN } from "./global-setup";
import { signUp, staffLogIn, uniqueEmail } from "./helpers";

test("admin adds an offer → member earns points → claims it → counter redeems the voucher", async ({ page, browser }) => {
  const title = `E2E Free hour ${Date.now() % 100000}`;

  // Admin adds a 100-point offer.
  await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
  await page.goto("/admin/offers");
  await page.getByLabel("Offer", { exact: true }).fill(title);
  await page.getByLabel("Lounge Points cost").fill("100");
  await page.getByRole("button", { name: "Add offer" }).click();
  await expect(page.getByText(`"${title}" is now in the shop.`)).toBeVisible();

  // A member signs up and is checked in at Station 04.
  const memberContext = await browser.newContext();
  const member = await memberContext.newPage();
  const code = await signUp(member, uniqueEmail("loyal"), "loyal-pass-1", "Loyal Member");
  await page.goto("/staff");
  await page.getByLabel("Member code, email or mobile").fill(code);
  await page.getByLabel("Station", { exact: true }).selectOption("4");
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(page.getByText("Loyal Member checked in.")).toBeVisible();

  // Pretend they played 10 hours (100 points), then check them out.
  const sql = postgres(process.env.TEST_DATABASE_URL!, { max: 1, onnotice: () => {} });
  await sql`update play_sessions set started_at = now() - interval '10 hours'
            where status = 'open' and gamer_id = (select id from gamers where member_code = ${code})`;
  await sql.end();
  await page.reload();
  const station = page.getByRole("region", { name: "Station 04", exact: true });
  await station.getByRole("button", { name: "Check out", exact: true }).click();
  await station.getByRole("button", { name: /Confirm check-out/ }).click();
  await expect(page.getByText(/Checked out 1 player · 10 h/)).toBeVisible();

  // The member sees 100 points and claims the offer.
  await member.goto("/shop");
  await expect(member.locator("main")).toContainText(/You have\s*100\s*Lounge Points/);
  const card = member.getByRole("article").filter({ hasText: title });
  await card.getByRole("button", { name: "Claim" }).click();
  await card.getByRole("button", { name: "Confirm: spend 100 Lounge Points" }).click();
  await expect(member).toHaveURL(/\/account\/vouchers\?new=V-/);
  const voucherCode = (await member.locator("main .font-mono").first().textContent())!.trim();

  // The counter checks and redeems it; a second try is refused.
  await page.goto("/staff/vouchers");
  await page.getByLabel("Voucher code").fill(voucherCode.toLowerCase());
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("Loyal Member")).toBeVisible();
  await page.getByRole("button", { name: "Mark as used" }).click();
  await expect(page.getByText(`Done. Hand over: ${title}.`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as used" })).toHaveCount(0);

  // The member's history shows the visit and the claim.
  await member.goto("/account/points");
  await expect(member.getByText(/Played 10 h at Station 04/)).toBeVisible();
  await expect(member.getByText(`Claimed: ${title}`)).toBeVisible();
  await memberContext.close();
});
