export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlugFromTitle(
  title: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title) || "product";
  if (!(await isTaken(base))) return base;
  let n = 2;
  while (await isTaken(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}
