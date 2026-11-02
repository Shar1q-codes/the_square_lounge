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
