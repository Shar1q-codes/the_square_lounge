import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { StationBoard } from "@/components/staff/StationBoard";
import { getBoard } from "@/server/sessions/board";

export const metadata: Metadata = { title: "Station board | The Square Lounge" };

export default async function StaffBoardPage() {
  const board = await getBoard();
  return (
    <>
      <PageTitle eyebrow="Counter" title="Station board" />
      {board.stations.length === 0 ? (
        <p className="text-muted">No stations yet. Run <code>npm run db:seed</code> to add them from the site settings.</p>
      ) : (
        <StationBoard now={board.now} stations={board.stations} />
      )}
    </>
  );
}
