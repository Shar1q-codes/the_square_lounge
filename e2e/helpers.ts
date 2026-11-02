import { expect, type Page } from "@playwright/test";

export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;

/** Signs up through /join and returns the new member code shown on /account. */
export async function signUp(page: Page, email: string, password: string, name = "E2E Gamer") {
  await page.goto("/join");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByLabel("Password").fill(password);
  await page.getByLabel("Birth year").fill("2000");
  await page.getByLabel("Area").fill("Malakpet");
  await page.getByLabel("Pincode").fill("500036");
  await page.getByLabel("How did you hear about us?").selectOption("instagram");
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create my account" }).click();

  await expect(page).toHaveURL(/\/account$/);
  const code = (await page.getByText(/^SQ-[A-Z0-9]{5}$/).first().textContent())?.trim();
  expect(code).toMatch(/^SQ-/);
  return code!;
}

export async function staffLogIn(page: Page, username: string, password: string) {
  await page.goto("/staff/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/staff$/);
}

export async function staffLogOut(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/staff\/login$/);
}
