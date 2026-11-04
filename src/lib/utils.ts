/** Join class names, skipping falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Section links ("#pricing") point back to the homepage from other pages. */
export function navHref(href: string, home: boolean): string {
  return !home && href.startsWith("#") ? `/${href}` : href;
}
