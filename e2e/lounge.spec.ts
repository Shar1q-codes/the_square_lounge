import { expect, test } from "@playwright/test";

test("The Lounge link in the navbar opens the 3D lounge", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "The Lounge" }).click();
  await expect(page).toHaveURL(/\/lounge$/);
  await expect(page.getByRole("heading", { name: "The Lounge" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();

  // From here the section links go back to the homepage.
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pricing" })).toHaveAttribute(
    "href",
    "/#pricing",
  );
});

test("viewpoint buttons switch the view and stop the tour", async ({ page }) => {
  await page.goto("/lounge");
  await expect(page.getByText("Guided tour")).toBeVisible();
  const viewpoints = page.getByRole("navigation", { name: "Viewpoints" });
  await viewpoints.getByRole("button", { name: "Café corner" }).click();
  await expect(viewpoints.getByRole("button", { name: "Café corner" })).toHaveAttribute("aria-pressed", "true");
  await expect(viewpoints.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("Drag to look around")).toBeVisible();
});

test("a ?view= link opens at that viewpoint", async ({ page }) => {
  await page.goto("/lounge?view=ps5-wall");
  await expect(
    page.getByRole("navigation", { name: "Viewpoints" }).getByRole("button", { name: "PS5 wall" }),
  ).toHaveAttribute("aria-pressed", "true");
});
