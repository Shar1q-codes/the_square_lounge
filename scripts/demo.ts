/**
 * Demo data for trying the app (members, two months of visits, offers, vouchers, a counter account).
 *   npm run db:seed-demo / db:clear-demo               (local)
 *   npm run supabase:seed-demo / supabase:clear-demo   (live Supabase)
 * All demo accounts use DEMO_PASSWORD from .env.local. Seeding replaces earlier demo data;
 * clearing removes it and never touches real members.
 */
import { run, useTarget } from "./target";

run(async () => {
  const command = process.argv[2];
  if (command !== "seed" && command !== "clear") throw new Error("Usage: tsx scripts/demo.ts <seed|clear> [--supabase]");
  const target = useTarget();
  const { clearDemo, seedDemo, DEMO_EMAIL_DOMAIN, DEMO_STAFF_USERNAME } = await import("../src/server/demo/demoData");

  if (command === "clear") {
    await clearDemo();
    console.log("Demo data removed.");
    return;
  }

  const password = process.env.DEMO_PASSWORD ?? "";
  if (password.length < 8) throw new Error("Set DEMO_PASSWORD (8+ characters) in .env.local first.");
  const summary = await seedDemo({ password });
  console.log(
    [
      `Demo data ready: ${summary.gamers} members, ${summary.visits} visits, ${summary.offers} offers, ${summary.vouchers} vouchers, ${summary.playingNow} playing now.`,
      `Member logins: any email ending @${DEMO_EMAIL_DOMAIN} (e.g. arjun.1@${DEMO_EMAIL_DOMAIN}) with DEMO_PASSWORD.`,
      `Counter staff login: ${DEMO_STAFF_USERNAME} with DEMO_PASSWORD.`,
      target.name === "supabase" ? "Remove it before launch: npm run supabase:clear-demo" : "Remove it any time: npm run db:clear-demo",
    ].join("\n"),
  );
});
