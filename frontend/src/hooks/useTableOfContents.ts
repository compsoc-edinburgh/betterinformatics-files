import React from "react";

export interface TableOfContentsEntry {
  level: number;
  text: string;
  slug: string;
}

export const useTableOfContents = (
  markdown: string,
): IteratorObject<TableOfContentsEntry> => {
  const headings = React.useMemo(() => {
    const regex = /^(#{1,6})\s+(.*)$/gm;
    return markdown.matchAll(regex).map(match => {
      const level = match[1].length;
      const text = match[2];

      // Same algorithm as in MarkdownText.tsx to generate slugs for headings
      const slug = text
        .toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return { level, text, slug };
    });
  }, [markdown]);

  return headings;
};
