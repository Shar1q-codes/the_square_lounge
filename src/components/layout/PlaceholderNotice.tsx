import { site } from "@/config/site";

/** Collects every "TODO:" string in site.ts, with its path, e.g. "contact.phone". */
function findPlaceholders(value: unknown, path: string[] = [], out: string[] = []): string[] {
  if (typeof value === "string") {
    if (value.trim().toUpperCase().startsWith("TODO")) out.push(path.join("."));
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => findPlaceholders(v, [...path, String(i)], out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) findPlaceholders(v, [...path, k], out);
  }
  return out;
}

/**
 * Development-only reminder of how many placeholders are left in src/config/site.ts.
 * Rendered only when NODE_ENV is "development", so it never ships.
 */
export function PlaceholderNotice() {
  const paths = findPlaceholders(site);
  if (paths.length === 0) return null;
  return (
    <details className="fixed bottom-4 left-4 z-[70] max-w-xs rounded-xl border border-dashed border-gold/50 bg-bg/90 px-3 py-2 text-xs text-muted backdrop-blur">
      <summary className="cursor-pointer text-gold">
        {paths.length} placeholders left in site.ts (dev only)
      </summary>
      <ul className="mt-2 max-h-60 overflow-auto font-mono" data-lenis-prevent>
        {paths.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </details>
  );
}
