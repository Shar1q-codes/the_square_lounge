import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";
import { signUp, staffLogIn, staffLogOut, uniqueEmail } from "./helpers";

test.describe("gamer account", () => {
  test("sign up → log out → log in → edit → delete", async ({ page }) => {
    const email = uniqueEmail("journey");
    await signUp(page, email, "journey-pass-1", "Journey Gamer");
    await expect(page.getByRole("heading", { name: "Hi, Journey" })).toBeVisible();
    await expect(page.getByRole("img", { name: /QR code for member code/ })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email.toUpperCase());
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("That email and password don't match.")).toBeVisible();

    await page.getByLabel("Password").fill("journey-pass-1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/account$/);

    await page.getByLabel("Area").fill("Chaderghat");
    await page.getByRole("button", { name: "Save details" }).click();
    await expect(page.getByRole("status")).toHaveText("Profile saved.");

    await page.getByRole("link", { name: "Privacy and your data" }).click();
    await page.getByLabel("Your password").fill("journey-pass-1");
    await page.getByLabel(/I understand/).check();
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page).toHaveURL(/\/\?account=deleted$/);

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("journey-pass-1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("That email and password don't match.")).toBeVisible();
  });

  test("a duplicate email is refused", async ({ page }) => {
    const email = uniqueEmail("dupe");
    await signUp(page, email, "dupe-pass-1");
    await page.getByRole("button", { name: "Log out" }).click();

    await page.goto("/join");
    await page.getByLabel("Full name").fill("Second Person");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Password").fill("another-pass-1");
    await page.getByLabel("Birth year").fill("1998");
    await page.getByLabel("Area").fill("Malakpet");
    await page.getByLabel("Pincode").fill("500036");
    await page.getByLabel("How did you hear about us?").selectOption("friend");
    await page.getByLabel(/I agree to the/).check();
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(page.getByText("This email already has an account. Log in instead.")).toBeVisible();
    await expect(page).toHaveURL(/\/join$/);
  });
});

test.describe("access control", () => {
  test("logged-out visitors are sent to the right login page", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/staff/gamers");
    await expect(page).toHaveURL(/\/staff\/login$/);
    await page.goto("/admin/staff");
    await expect(page).toHaveURL(/\/staff\/login$/);
  });
});

test.describe("staff and admin", () => {
  test("admin adds staff → staff finds a gamer and sets a temporary password", async ({ page, browser }) => {
    // A gamer signs up in a separate browser context.
    const gamerContext = await browser.newContext();
    const gamerPage = await gamerContext.newPage();
    const gamerEmail = uniqueEmail("counter");
    const memberCode = await signUp(gamerPage, gamerEmail, "counter-pass-1", "Counter Gamer");

    // Admin creates a counter staff account.
    const username = `e2e.staff${Date.now() % 100000}`;
    await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
    await page.getByRole("link", { name: "Staff", exact: true }).click();
    await page.getByLabel("Name", { exact: true }).fill("E2E Counter");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Temporary password").fill("counter-staff-1");
    await page.getByRole("button", { name: "Add staff member" }).click();
    await expect(page.getByRole("status")).toContainText(`log in as "${username}"`);
    await staffLogOut(page);

    // The new staff member can't reach admin pages but can look up the gamer.
    await staffLogIn(page, username, "counter-staff-1");
    await page.goto("/admin/staff");
    await expect(page).toHaveURL(/\/staff$/);

    await page.getByRole("link", { name: "Gamers" }).click();
    // The station board has a field with the same label, so wait for the Gamers page first.
    await expect(page.getByRole("heading", { name: "Find a gamer" })).toBeVisible();
    await page.getByLabel("Member code, email or mobile").fill(memberCode.toLowerCase());
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Counter Gamer")).toBeVisible();
    await expect(page.getByText(memberCode)).toBeVisible();

    await page.getByRole("button", { name: "Set temporary password" }).click();
    const status = page.getByRole("status");
    await expect(status).toContainText("Temporary password:");
    const tempPassword = (await status.locator(".font-mono").textContent())!.trim();

    // The gamer's old session ended; the temporary password works.
    await gamerPage.reload();
    await expect(gamerPage).toHaveURL(/\/login$/);
    await gamerPage.getByLabel("Email").fill(gamerEmail);
    await gamerPage.getByLabel("Password").fill(tempPassword);
    await gamerPage.getByRole("button", { name: "Log in" }).click();
    await expect(gamerPage).toHaveURL(/\/account$/);
    await gamerContext.close();
  });
});
