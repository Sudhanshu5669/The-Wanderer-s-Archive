export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "untitled";
}

/**
 * Ensure a slug is unique given a predicate that checks existence.
 * Appends -2, -3, ... until free.
 */
export async function uniqueSlug(
  desired: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(desired);
  let candidate = base;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}
