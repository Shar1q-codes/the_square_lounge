import { exportGamerData } from "@/server/identity/consent";
import { currentGamer } from "@/server/identity/currentUser";

/** "Download my data": a JSON file of everything held about the logged-in gamer. */
export async function GET() {
  const gamer = await currentGamer();
  if (!gamer) return new Response("Please log in first.", { status: 401 });

  const data = await exportGamerData(gamer.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="square-lounge-${gamer.memberCode}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
