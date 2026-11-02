import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";
import { signUp, staffLogIn, uniqueEmail } from "./helpers";

const stationCard = (page: Page, name: string) => page.getByRole("region", { name, exact: true });

async function checkInAt(page: Page, memberCode: string, stationId: string) {
  await page.getByLabel("Member code, email or mobile").fill(memberCode);
  await page.getByLabel("Station", { exact: true }).selectOption(stationId);
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(page.getByText(/checked in\.$/)).toBeVisible();
}

test("staff check two members into one station, check out the station, and the gamer sees the visit", async ({ page, browser }) => {
  // Two members sign up on their own phones.
  const gamerContext = await browser.newContext();
  const gamerPage = await gamerContext.newPage();
  const firstCode = await signUp(gamerPage, uniqueEmail("duo-a"), "duo-pass-1", "Duo Alpha");
  const friendContext = await browser.newContext();
  const secondCode = await signUp(await friendContext.newPage(), uniqueEmail("duo-b"), "duo-pass-2", "Duo Bravo");
  await friendContext.close();

  // Counter checks both in at Station 02.
  await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
  await checkInAt(page, firstCode, "2");
  await checkInAt(page, secondCode, "2");

  const card = stationCard(page, "Station 02");
  await expect(card.getByLabel("2 of 8 players")).toBeVisible();
  await expect(card.getByText("Duo Alpha")).toBeVisible();
  await expect(card.getByText("Duo Bravo")).toBeVisible();

  // The gamer sees they're playing.
  await gamerPage.reload();
  await expect(gamerPage.getByText(/Now playing\s+at Station 02/)).toBeVisible();

  // Checking the same member in again is refused.
  await page.getByLabel("Member code, email or mobile").fill(firstCode);
  await page.getByLabel("Station", { exact: true }).selectOption("3");
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(page.getByText(/Already playing at Station 02 since/)).toBeVisible();

  // Whole-station check-out with ₹300 by UPI.
  await card.getByRole("button", { name: "Check out whole station" }).click();
  await card.getByLabel("Amount paid in rupees").fill("300");
  await card.getByLabel("Payment method").selectOption("upi");
  await card.getByRole("button", { name: "Check out all 2 players" }).click();
  await expect(page.getByText(/Checked out 2 players · .* · ₹300/)).toBeVisible();
  await expect(card.getByText("Free")).toBeVisible();

  // The gamer's account lists the visit and no longer says "Now playing".
  await gamerPage.reload();
  await expect(gamerPage.getByRole("heading", { name: "Recent visits" })).toBeVisible();
  await expect(gamerPage.getByText("· Station 02")).toBeVisible();
  await expect(gamerPage.getByText(/Now playing/)).toHaveCount(0);
  await gamerContext.close();
});
