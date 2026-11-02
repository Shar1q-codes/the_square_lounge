import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type Props = { title: string; intro?: string; csv?: string; children: ReactNode; className?: string };

/** A dashboard card with a heading and an optional CSV download link. */
export function Section({ title, intro, csv, children, className }: Props) {
  return (
    <Card as="section" aria-label={title} className={`grid content-start gap-4 p-5 sm:p-6 ${className ?? ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {csv && (
          <Link href={csv} prefetch={false} className="text-xs text-gold underline-offset-4 hover:underline">
            Download CSV
          </Link>
        )}
      </div>
      {intro && <p className="-mt-2 text-sm text-muted">{intro}</p>}
      {children}
    </Card>
  );
}

/** A small table that scrolls inside its own box on narrow screens. */
export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Nothing in this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            {head.map((h, i) => (
              <th key={h} scope="col" className={`py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {row.map((cell, i) => (
                <td key={i} className={`py-2 ${i > 0 ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
