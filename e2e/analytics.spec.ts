import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { hashPassword } from "../src/server/identity/password";
import { E2E_ADMIN } from "./global-setup";
import { staffLogIn } from "./helpers";

test("admin views analytics, switches range and downloads the visits CSV", async ({ page }) => {
  await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page.getByRole("heading", { name: "Analytics", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "When it's busy" })).toBeVisible();

  await page.getByRole("link", { name: "30 days" }).click();
  await expect(page).toHaveURL(/range=30d/);
  await expect(page.getByRole("link", { name: "30 days" })).toHaveAttribute("aria-current", "page");

  const trend = page.getByRole("region", { name: "Daily trend" });
  const [download] = await Promise.all([page.waitForEvent("download"), trend.getByRole("link", { name: "Download CSV" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^square-lounge-visits-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/);
  const path = await download.path();
  const { readFile } = await import("node:fs/promises");
  const text = (await readFile(path!, "utf8")).replace(/^﻿/, "");
  expect(text.split("\n")[0]).toBe(
    "Business day,Start (IST),End (IST),Minutes,Station,Console,Member code,Area,Pincode,Age band,Revenue share (Rs),Payment method",
  );
});

test("counter staff can't open analytics or its downloads", async ({ page }) => {
  const username = `e2e.counter${Date.now() % 100000}`;
  const sql = postgres(process.env.TEST_DATABASE_URL!, { max: 1, onnotice: () => {} });
  await sql`insert into staff (username, display_name, password_hash, role)
            values (${username}, 'Counter Only', ${await hashPassword("counter-only-1")}, 'staff')`;
  await sql.end();

  await staffLogIn(page, username, "counter-only-1");
  await expect(page.getByRole("link", { name: "Analytics" })).toHaveCount(0);
  await page.goto("/admin/analytics");
  await expect(page).toHaveURL(/\/staff$/);
  const response = await page.request.get("/admin/analytics/export/visits", { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
});
