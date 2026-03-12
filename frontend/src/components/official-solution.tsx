// import { pdfjs } from 'pdfjs-dist';
import { PDFDocumentLoadingTask } from "pdfjs-dist";
import { getDocument } from "../pdf/pdfjs";
import React, { useMemo, useRef, useEffect, useState } from "react";
import { ComponentRenderer } from "./markdown-text";
import { Tooltip } from "@mantine/core";
import { fetchGet } from "../api/fetch-utils";
import { useRequest } from "ahooks";

interface PProps {
  url: string;
  refPage: number;
  p1X: number;
  p1Y: number;
  p2X: number;
  p2Y: number;
}

const DEFAULT_WIDTH = 500;

/**
 * Fetches the actual PDF URL from the API based on the url type (solution/exam/document).
 * Uses useRequest with caching to prevent duplicate network requests on re-renders.
 */
function usePdfUrl(url: string): string | undefined {
  const fetchPdfUrl = async () => {
    const parts = url.split("/");
    const type = parts[0]?.toLowerCase();
    const filename = parts[1];

    switch (type) {
      case "solution":
        return (await fetchGet(`/api/exam/pdf/solution/${filename}/`)) || null;
      case "exam":
        return (await fetchGet(`/api/exam/pdf/exam/${filename}/`)) || null;
      case "document":
        return null; // Not yet implemented
      default:
        return null;
    }
  };

  const { data } = useRequest(fetchPdfUrl, {
    cacheKey: `pdf-url-${url}`,
    refreshDeps: [url],
  });

  return data?.value;
}

const PdfRenderer: React.FC<PProps> = React.memo(
  ({ url, refPage, p1X, p1Y, p2X, p2Y }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const myCanvas = useRef<HTMLCanvasElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(DEFAULT_WIDTH);
    const pdfUrl = usePdfUrl(url);

    // Measure container width using ResizeObserver
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            setContainerWidth(width);
          }
        }
      });

      resizeObserver.observe(container);
      // Set initial width
      if (container.offsetWidth > 0) {
        setContainerWidth(container.offsetWidth);
      }

      return () => resizeObserver.disconnect();
    }, []);

    // Render PDF when we have the URL and container width
    useEffect(() => {
      if (!pdfUrl || !myCanvas.current) return;

      let cancelled = false;

      const renderPdf = async () => {
        const loadingTask: PDFDocumentLoadingTask = getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(Math.min(refPage, pdf.numPages));
        if (cancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          2.5,
          (0.8 * containerWidth) /
            (unscaledViewport.width * Math.abs(p1X - p2X)),
        );
        const offsetX = -unscaledViewport.width * scale * p1X;
        const offsetY = -unscaledViewport.height * scale * p1Y;
        const viewport = page.getViewport({
          scale,
          offsetX,
          offsetY,
        });

        const context = myCanvas.current?.getContext("2d");
        if (context && myCanvas.current) {
          myCanvas.current.height = viewport.height * Math.abs(p1Y - p2Y);
          myCanvas.current.width = viewport.width * Math.abs(p1X - p2X);
          page.render({ canvasContext: context, viewport });
        }
      };

      renderPdf();

      return () => {
        cancelled = true;
      };
    }, [pdfUrl, refPage, p1X, p1Y, p2X, p2Y, containerWidth]);

    return (
      <div ref={containerRef} style={{ width: "100%" }}>
        <canvas ref={myCanvas} />
      </div>
    );
  },
);

PdfRenderer.displayName = "PdfRenderer";

/**
 * Returns a memoized custom language renderer for the MarkdownText component.
 *
 * The MarkdownText component uses react-markdown which accepts custom renderers
 * for code blocks via the `languages` prop. When a code block is tagged with
 * ```official, this renderer is invoked instead of the default code block renderer.
 *
 * This hook exists because:
 * 1. We need to provide the correct object shape expected by MarkdownText's
 *    `languages` prop: { [languageName]: ComponentRenderer }
 * 2. The object must be memoized to prevent unnecessary re-renders of the
 *    markdown content when parent components re-render
 *
 * The "official" language renders PDF snippets from official exam solutions,
 * parsed from markdown content like:
 * ```official
 * page: 1
 * from-relative-coords: (0.1, 0.2)
 * to-relative-coords: (0.9, 0.8)
 * url: solution/exam123.pdf
 * ```
 */
export const useOfficialSolutionLanguage = (): {
  [key: string]: ComponentRenderer;
} => {
  return useMemo(
    () => ({
      official: ({ children }) => (
        <OfficialSolution value={String(children).replace(/\n$/, "")} />
      ),
    }),
    [],
  );
};

interface Props {
  value?: string | null;
}

const REGEX =
  /page: (\d+)\r?\nfrom-relative-coords: \((0.\d+|1), (0.\d+|1)\)\r?\nto-relative-coords: \((0.\d+|1), (0.\d+|1)\)\r?\nurl: (\S+)/;

const OfficialSolution: React.FC<Props> = React.memo(({ value }) => {
  const renderedPDF = useMemo(() => {
    if (!value) {
      return <>Invalid Official Solution Syntax: Missing content</>;
    }

    const match = REGEX.exec(value);
    if (!match) {
      return (
        <>
          Invalid syntax: the official solution snippet does match the RegEx ($
          {REGEX.toString()})
        </>
      );
    }

    const page = parseInt(match[1], 10);
    if (page < 1) {
      return <>Invalid Official Solution Syntax: Invalid page number (min 1)</>;
    }

    const p1X = parseFloat(match[2]);
    const p1Y = parseFloat(match[3]);
    const p2X = parseFloat(match[4]);
    const p2Y = parseFloat(match[5]);
    const url = match[6];

    return (
      <Tooltip label="Official Solution">
        <PdfRenderer
          url={url}
          refPage={page}
          p1X={p1X}
          p1Y={p1Y}
          p2X={p2X}
          p2Y={p2Y}
        />
      </Tooltip>
    );
  }, [value]);

  return renderedPDF;
});

OfficialSolution.displayName = "OfficialSolution";

export default OfficialSolution;
