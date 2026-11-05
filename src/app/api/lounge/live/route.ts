import { liveStations } from "@/server/sessions/live";

export const dynamic = "force-dynamic";

/** Which stations are booked right now and what game is on, for the 3D lounge. Public: no personal data. */
export async function GET() {
  try {
    return Response.json(await liveStations(), {
      // Shared caches may hold it briefly, so many visitors don't each hit the database.
      headers: { "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=15" },
    });
  } catch {
    return Response.json([], { status: 503 });
  }
}
