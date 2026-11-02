import Link from "next/link";
import type { Range } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const presets = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
] as const;

/** Preset links plus a custom date form. Only dates go in the URL, so a view can be bookmarked. */
export function RangePicker({ range }: { range: Range }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <nav aria-label="Date range" className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Link
            key={p.key}
            href={`/admin/analytics?range=${p.key}`}
            aria-current={range.key === p.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              range.key === p.key ? "border-gold/60 text-gold-soft" : "border-border text-muted hover:text-fg",
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <form method="get" action="/admin/analytics" className="flex flex-wrap items-end gap-2 text-sm">
        <input type="hidden" name="range" value="custom" />
        <label className="grid gap-1 text-xs text-muted">
          From
          <input type="date" name="from" defaultValue={range.fromDate} required className="h-9 rounded-lg border border-border bg-bg/60 px-2 text-sm text-fg [color-scheme:dark]" />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          To
          <input type="date" name="to" defaultValue={range.toDate} required className="h-9 rounded-lg border border-border bg-bg/60 px-2 text-sm text-fg [color-scheme:dark]" />
        </label>
        <button
          type="submit"
          className={cn(
            "h-9 rounded-full border px-4 transition-colors",
            range.key === "custom" ? "border-gold/60 text-gold-soft" : "border-border text-muted hover:text-fg",
          )}
        >
          Apply
        </button>
      </form>
    </div>
  );
}
