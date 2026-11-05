import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import QRCode from "qrcode";
import { E2E_ADMIN } from "./global-setup";
import { signUp, staffLogIn, uniqueEmail } from "./helpers";

// Chrome reads this file as its camera, so the scanner sees a member's QR code.
const FAKE_CAMERA = path.resolve("test-results", "fake-camera.y4m");

/** A few seconds of a 480×480 greyscale video showing `text` as a QR code (YUV4MPEG2, what Chrome's fake camera reads). */
function writeQrVideo(text: string) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = 480;
  const cell = Math.floor(size / (modules.size + 8));
  const offset = Math.floor((size - cell * modules.size) / 2);
  const y = Buffer.alloc(size * size, 235);
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (!modules.get(row, col)) continue;
      for (let dy = 0; dy < cell; dy++) y.fill(16, (offset + row * cell + dy) * size + offset + col * cell, (offset + row * cell + dy) * size + offset + (col + 1) * cell);
    }
  }
  const chroma = Buffer.alloc((size / 2) * (size / 2) * 2, 128);
  const frame = Buffer.concat([Buffer.from("FRAME\n"), y, chroma]);
  writeFileSync(FAKE_CAMERA, Buffer.concat([Buffer.from(`YUV4MPEG2 W${size} H${size} F10:1 Ip A1:1 C420jpeg\n`), ...Array(30).fill(frame)]));
}

// The file must exist when Chrome starts; the camera test writes the real member's code into it.
mkdirSync(path.dirname(FAKE_CAMERA), { recursive: true });
writeQrVideo("SQ-AAAAA");
// The full Chromium build: the default headless shell has no fake camera.
test.use({ channel: "chromium", launchOptions: { args: ["--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${FAKE_CAMERA}`] } });

test("staff check a member in by typed code, then out again, from the Scan member panel", async ({ page, browser }) => {
  const gamerContext = await browser.newContext();
  const code = await signUp(await gamerContext.newPage(), uniqueEmail("scan"), "scan-pass-1", "Scan Gamer");
  await gamerContext.close();

  await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
  await page.getByRole("button", { name: "Scan member" }).click();
  const dialog = page.getByRole("dialog", { name: "Scan member" });
  await dialog.getByLabel("Member code").fill(code.toLowerCase());
  await dialog.getByRole("button", { name: "Find" }).click();

  await expect(dialog.getByText("Scan Gamer")).toBeVisible();
  await dialog.getByLabel("Game (optional)").selectOption("gta-v");
  await dialog.getByRole("button", { name: /^Station 03/ }).click();
  await expect(dialog.getByText("Scan Gamer checked in.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Station 03", exact: true }).getByText("Scan Gamer")).toBeVisible();

  // Scanning the same member again offers check-out.
  await dialog.getByRole("button", { name: "Scan next" }).click();
  await dialog.getByLabel("Member code").fill(code);
  await dialog.getByRole("button", { name: "Find" }).click();
  await expect(dialog.getByText(/Playing at Station 03 since/)).toBeVisible();
  await expect(dialog.getByText(/Grand Theft Auto V/)).toBeVisible();
  await dialog.getByLabel("Amount paid in rupees").fill("70");
  await dialog.getByRole("button", { name: /^Check out/ }).click();
  await expect(dialog.getByText(/Checked out 1 player · .* · ₹70/)).toBeVisible();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("region", { name: "Station 03", exact: true }).getByText("Scan Gamer")).toHaveCount(0);

  // Not a member code.
  await page.getByRole("button", { name: "Scan member" }).click();
  await dialog.getByLabel("Member code").fill("hello");
  await dialog.getByRole("button", { name: "Find" }).click();
  await expect(dialog.getByText(/isn't a member QR code/)).toBeVisible();
});

test.describe("with a camera", () => {
  test.use({ permissions: ["camera"] });

  test("the camera reads the member's QR code", async ({ page, browser }) => {
    const gamerContext = await browser.newContext();
    const code = await signUp(await gamerContext.newPage(), uniqueEmail("cam"), "cam-pass-1", "Camera Gamer");
    await gamerContext.close();
    writeQrVideo(code);

    await staffLogIn(page, E2E_ADMIN.username, E2E_ADMIN.password);
    await page.getByRole("button", { name: "Scan member" }).click();
    const dialog = page.getByRole("dialog", { name: "Scan member" });
    await expect(dialog.getByText("Camera Gamer")).toBeVisible({ timeout: 20_000 });
    await expect(dialog.getByText(code)).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^Station 01/ })).toBeVisible();
  });
});
