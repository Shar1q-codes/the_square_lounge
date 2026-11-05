import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";
import { signUp, staffLogIn, uniqueEmail } from "./helpers";

type Live = { id: number; busy: boolean; game: string | null }[];

test("the game picked at check-in shows on the lounge until check-out; the gamer can change it", async ({ page, browser }) => {
  const gamerContext = await browser.newContext();
  const gamer = await gamerContext.newPage();
  const code = await signUp(gamer, uniqueEmail("player"), "player-pass-1", "Station Player");

  await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
  await page.getByLabel("Member code, email or mobile").fill(code);
  await page.getByLabel("Station", { exact: true }).selectOption("1");
  await page.getByLabel("Game (optional)").selectOption("ufc-5");
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(page.getByText(/checked in\.$/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Station 01", exact: true }).getByText("UFC 5")).toBeVisible();

  const station1 = async () => ((await (await page.request.get("/api/lounge/live")).json()) as Live).find((s) => s.id === 1);
  expect(await station1()).toEqual({ id: 1, busy: true, game: "ufc-5" });

  // The gamer switches game from their account page.
  await gamer.reload();
  await gamer.getByLabel("What are you playing?").selectOption("mortal-kombat-1");
  await expect.poll(async () => (await station1())?.game).toBe("mortal-kombat-1");

  // The lounge page's TV card says the station is booked.
  await page.goto("/lounge");
  await expect(page.locator("canvas")).toBeVisible();

  // Check-out frees it.
  await page.goto("/staff");
  const card = page.getByRole("region", { name: "Station 01", exact: true });
  await card.getByRole("button", { name: "Check out", exact: true }).first().click();
  await card.getByRole("button", { name: /^Confirm check-out/ }).click();
  await expect.poll(async () => (await station1())?.busy).toBe(false);
  await gamerContext.close();
});

test("the booking form asks which game, filtered to the station's console", async ({ page }) => {
  await page.goto("/#booking", { waitUntil: "networkidle" });
  const game = page.getByLabel("Game (optional)");
  await expect(game.getByRole("option", { name: "Mortal Kombat 1" })).toHaveCount(1);
  await page.getByLabel("Station", { exact: true }).selectOption("4"); // a PS4 station
  await expect(game.getByRole("option", { name: "Mortal Kombat 1" })).toHaveCount(0);
  await expect(game.getByRole("option", { name: "Grand Theft Auto V" })).toHaveCount(1);
});

test("a member can book a station from their account page, with their name filled in", async ({ page }) => {
  await signUp(page, uniqueEmail("booker"), "booker-pass-1", "Booking Gamer");
  const book = page.getByRole("region", { name: "Book a station" });
  await expect(book).toBeVisible();
  await expect(book.getByLabel("Your name")).toHaveValue("Booking Gamer");
  await expect(page.getByRole("link", { name: "Book", exact: true })).toHaveAttribute("href", "/account#book");
});
