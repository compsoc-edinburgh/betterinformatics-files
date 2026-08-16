import React, { useEffect, useState } from "react";
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
  activeIndex: number;
}> = ({ entries, index, activeIndex }) => {
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
        color:
          index === activeIndex
            ? "var(--mantine-text-color)"
            : "var(--mantine-color-dimmed)",
        textDecoration: "none",
        transition: "color 150ms ease",
        minWidth: "100%",
        width: 0,
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
            strokeWidth="2"
            fill="none"
            style={{
              stroke:
                index <= activeIndex
                  ? "var(--mantine-primary-color-filled-hover)"
                  : "var(--mantine-primary-color-light)",
              transition: "stroke 150ms ease",
            }}
          />
        )}
        <line
          x1={l1 + 0.5}
          y1={l0 === l1 ? "6" : "12"}
          x2={l1 + 0.5}
          y2="100%"
          strokeWidth="2"
          style={{
            stroke:
              index <= activeIndex
                ? "var(--mantine-primary-color-filled-hover)"
                : "var(--mantine-primary-color-light)",
            transition: "stroke 150ms ease",
          }}
        />
      </svg>
      {entry.text}
    </Anchor>
  );
};

export const ToCContainer: React.FC<{
  entries: TableOfContentsEntry[];
  children: (activeIndex: number) => React.ReactNode;
}> = ({ entries, children }) => {
  // Track scroll position against each heading's document offset to select
  // the active entry, and pass its index down to display children with.
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }

    let offsets: number[] = [];
    const measure = () => {
      offsets = entries.map(entry => {
        // Get its top offset
        const el = document.getElementById(entry.slug);
        if (!el) return Infinity;

        // Compensate for any scroll-margin-top
        const scrollMarginTop =
          parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        return (
          el.getBoundingClientRect().top + window.scrollY - scrollMarginTop
        );
      });
      updateActiveIndex();
    };

    const updateActiveIndex = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // At the very top of the page, always highlight the first heading
      if (scrollY <= 1) {
        setActiveIndex(0);
        return;
      }
      // At the very bottom of the page, always highlight the last heading
      if (scrollY + viewportHeight >= docHeight - 1) {
        setActiveIndex(entries.length - 1);
        return;
      }

      // Otherwise, check at 20% down the viewport
      const referenceLine = scrollY + viewportHeight * 0.2;
      let index = offsets.findLastIndex(offset => offset <= referenceLine);
      if (index === -1) {
        index = 0;
      }
      setActiveIndex(index);
    };

    // Only re-measure on start on window resize
    measure();
    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(document.body);

    // On scroll just use the cached offsets to highlight
    window.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [entries]);

  return children(entries.length ? activeIndex : -1);
};
