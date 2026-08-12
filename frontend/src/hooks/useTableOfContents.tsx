import React from "react";
import { slugifyHeading } from "../components/markdown-text";
import { Anchor } from "@mantine/core";

export interface TableOfContentsEntry {
  level: number;
  text: string;
  slug: string;
}

export const useTableOfContents = (
  markdown: string,
): TableOfContentsEntry[] => {
  const headings = React.useMemo(() => {
    const regex = /^(#{1,6})\s+(.*)$/gm;
    return [...markdown.matchAll(regex)].map(match => {
      const level = match[1].length;
      const text = match[2];

      // Same algorithm as in MarkdownText.tsx to generate slugs for headings
      const slug = slugifyHeading(text);
      return { level, text, slug };
    });
  }, [markdown]);

  return headings;
};

const BASE = 8;

function getItemOffset(depth: number): number {
  if (depth <= 1) return 12 + BASE;
  if (depth === 2) return 24 + BASE;
  if (depth === 3) return 36 + BASE;
  return 48 + BASE;
}

function getLineOffset(depth: number): number {
  if (depth <= 1) return BASE;
  if (depth === 2) return 8 + BASE;
  if (depth === 3) return 16 + BASE;
  return 24 + BASE;
}

export const ToCItem: React.FC<{
  entries: TableOfContentsEntry[];
  index: number;
}> = ({ entries, index }) => {
  const entry = entries[index];
  const l1 = getLineOffset(entry.level);
  const l0 = index === 0 ? l1 : getLineOffset(entries[index - 1].level);
  const l2 =
    index === entries.length - 1 ? l1 : getLineOffset(entries[index + 1].level);
  return (
    <Anchor
      display="block"
      key={entry.slug}
      href={`#${entry.slug}`}
      style={{
        paddingInlineStart: `${getItemOffset(entry.level)}px`,
        color: "var(--mantine-color-dimmed)",
        textDecoration: "none",
      }}
      pos="relative"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          bottom: l1 !== l2 ? "0" : "0.375rem",
          insetInlineStart: 0,
          top: "-0.375rem",
          height: l1 !== l2 ? "100%" : "calc(100% + 0.375rem)",
          zIndex: -1,
          width: Math.max(l0, l1) + 9,
        }}
      >
        {l0 !== l1 && (
          <path
            d={`M ${l0 + 0.5} 0 C ${l0 + 0.5} 8 ${l1 + 0.5} 4 ${l1 + 0.5} 12`}
            stroke="black"
            strokeWidth="1"
            fill="none"
            style={{
              stroke: "var(--mantine-primary-color-filled)",
            }}
          />
        )}
        <line
          x1={l1 + 0.5}
          y1={l0 === l1 ? "6" : "12"}
          x2={l1 + 0.5}
          y2="100%"
          strokeWidth="1"
          style={{
            stroke: "var(--mantine-primary-color-filled)",
          }}
        />
      </svg>
      {entry.text}
    </Anchor>
  );
};
