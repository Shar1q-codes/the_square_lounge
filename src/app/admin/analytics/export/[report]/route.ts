import { resolveRange } from "@/lib/analytics";
import { requireStaff } from "@/server/identity/currentUser";
import { exportReport } from "@/server/analytics/csv";

export const dynamic = "force-dynamic";

/** CSV download for one analytics report. Admins only; every download is audited. */
export async function GET(request: Request, { params }: { params: Promise<{ report: string }> }) {
  const admin = await requireStaff("admin");
  const { report } = await params;
  const search = new URL(request.url).searchParams;
  const range = resolveRange({
    range: search.get("range") ?? undefined,
    from: search.get("from") ?? undefined,
    to: search.get("to") ?? undefined,
  });

  const result = await exportReport(admin.id, report, range);
  if (!result) return new Response("Unknown report", { status: 404 });
  return new Response(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
