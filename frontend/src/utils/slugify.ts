export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    // ä -> a
    .replaceAll(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
