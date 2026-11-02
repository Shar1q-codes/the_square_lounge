import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { FormMessage } from "@/components/account/fields";
import { SessionRow } from "@/components/staff/SessionCorrection";
import { cn } from "@/lib/utils";
import { listSessionsForAdmin, type AdminFilter } from "@/server/sessions/corrections";

export const metadata: Metadata = { title: "Sessions | The Square Lounge" };

const filters: { value: AdminFilter; label: string }[] = [
  { value: "attention", label: "Needs attention" },
  { value: "open", label: "Playing now" },
  { value: "recent", label: "Last 7 days" },
];

export default async function AdminSessionsPage({ searchParams }: { searchParams: Promise<{ filter?: string; saved?: string }> }) {
  const { filter: requested, saved } = await searchParams;
  const filter = filters.find((f) => f.value === requested)?.value ?? "attention";
  const rows = await listSessionsForAdmin(filter);
  const now = new Date();

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageTitle eyebrow="Admin" title="Sessions">
        Fix forgotten check-outs or wrong times. Every change needs a reason and is logged.
      </PageTitle>
      {saved === "1" && <FormMessage notice="Correction saved. The change is in the audit log." />}
      <nav aria-label="Filter sessions" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/admin/sessions?filter=${f.value}`}
            aria-current={f.value === filter ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              f.value === filter ? "border-gold/60 text-gold-soft" : "border-border text-muted hover:text-fg",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="text-muted">Nothing here.</p>
      ) : (
        rows.map((row) => <SessionRow key={row.id} row={row} now={now} filter={filter} />)
      )}
    </div>
  );
}
