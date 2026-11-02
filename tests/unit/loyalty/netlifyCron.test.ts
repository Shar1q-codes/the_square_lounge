import { afterEach, describe, expect, it, vi } from "vitest";
import expireVouchers, { config } from "../../../netlify/functions/expire-vouchers";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Netlify scheduled function: expire-vouchers", () => {
  it("runs daily at 20:30 UTC (2:00 am IST)", () => {
    expect(config.schedule).toBe("30 20 * * *");
  });

  it("calls the protected expiry endpoint on the site with the secret", async () => {
    vi.stubEnv("URL", "https://squarelounge.example");
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"expired":2}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await expireVouchers();

    expect(fetchMock).toHaveBeenCalledWith("https://squarelounge.example/api/cron/expire-vouchers", {
      headers: { authorization: "Bearer s3cret-value" },
    });
    expect(response.status).toBe(200);
  });

  it("refuses to run without a secret, and calls nothing", async () => {
    vi.stubEnv("URL", "https://squarelounge.example");
    vi.stubEnv("CRON_SECRET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await expireVouchers()).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
