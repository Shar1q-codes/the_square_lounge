import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";
import { signUp, staffLogIn, uniqueEmail } from "./helpers";

test("a checked-in gamer orders from their station; staff hear the buzzer and deliver it", async ({ page, browser }) => {
  // Count buzzer tones on the staff page.
  await page.addInitScript(() => {
    const w = window as unknown as { buzzes: number };
    w.buzzes = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      w.buzzes++;
      return original.call(this);
    };
  });

  const gamerContext = await browser.newContext();
  const gamer = await gamerContext.newPage();
  const code = await signUp(gamer, uniqueEmail("hungry"), "hungry-pass-1", "Hungry Gamer");

  // Not checked in yet: the menu shows, but there is nothing to add.
  await gamer.goto("/order");
  await expect(gamer.getByText(/not checked in to a station yet/)).toBeVisible();
  await expect(gamer.getByRole("button", { name: /^Add / })).toHaveCount(0);

  // The counter checks them in at Station 05 and opens the orders page.
  await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
  await page.getByLabel("Member code, email or mobile").fill(code);
  await page.getByLabel("Station", { exact: true }).selectOption("5");
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(page.getByText(/checked in\.$/)).toBeVisible();
  await page.goto("/staff/orders");
  await page.mouse.click(5, 5); // a tap turns the buzzer on
  await expect(page.getByText("No orders waiting.")).toBeVisible();

  // The gamer orders two large salted fries and a zinger burger.
  await gamer.reload();
  await gamer.getByRole("button", { name: "Add Salted Fries Large" }).click();
  await gamer.getByRole("button", { name: "One more Salted Fries Large" }).click();
  await gamer.getByRole("button", { name: "Add Zinger Burger" }).click();
  await gamer.getByLabel(/Note for the kitchen/).fill("extra ketchup");
  await gamer.getByRole("button", { name: "Send to Station 05 · ₹330" }).click();
  await expect(gamer.getByText("Order sent to Station 05 (₹330).", { exact: false })).toBeVisible();
  await expect(gamer.getByText("Order sent", { exact: true })).toBeVisible();

  // Staff see it with a buzz and the count in the menu.
  const order = page.getByRole("article", { name: "Station 05 order" });
  await expect(order).toBeVisible({ timeout: 20_000 });
  await expect(order.getByText("extra ketchup")).toBeVisible();
  await expect(order.getByText("₹330")).toBeVisible();
  await expect(page.getByRole("link", { name: /Orders\s*1/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { buzzes: number }).buzzes)).toBeGreaterThan(0);

  await order.getByRole("button", { name: "Start preparing" }).click();
  await expect(order.getByText(/Being prepared/)).toBeVisible();
  await order.getByRole("button", { name: "Delivered" }).click();
  await expect(page.getByText("No orders waiting.")).toBeVisible();

  // The gamer's page catches up.
  await gamer.reload();
  await expect(gamer.getByText("Delivered", { exact: true })).toBeVisible();
  await gamerContext.close();
});
