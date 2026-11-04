import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test("sign-up works on a phone with no sideways scrolling", async ({ page }) => {
  await page.goto("/join");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await signUp(page, uniqueEmail("phone"), "phone-pass-1", "Phone Gamer");
  const accountOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(accountOverflow).toBeLessThanOrEqual(0);
});

test("the 3D lounge shows sideways, full-screen, on a phone held upright", async ({ page }) => {
  await page.goto("/lounge");
  const shell = page.locator("[data-rotated]");
  await expect(shell).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();

  // The canvas keeps its landscape size (long side across the rotated view).
  const size = await page.locator("canvas").evaluate((c) => ({ w: c.clientWidth, h: c.clientHeight }));
  expect(size.w).toBeGreaterThan(size.h);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("button", { name: "Full screen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Exit" })).toBeVisible();
  // The walk arrows sit inside the sideways view.
  const pad = page.getByRole("group", { name: "Walk" });
  await expect(pad.getByRole("button", { name: "Walk forward" })).toBeInViewport();
  await expect(pad.getByRole("button", { name: "Turn right" })).toBeInViewport();
});
