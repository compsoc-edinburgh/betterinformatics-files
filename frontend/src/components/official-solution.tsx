import { PDFDocumentLoadingTask } from "pdfjs-dist";
import { getDocument } from "../pdf/pdfjs";
import React, {
  forwardRef,
  memo,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
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
export function usePdfUrl(url: string): {
  loading: boolean;
  url: string | undefined;
  display_name: string | undefined;
} {
  const fetchPdfUrl = async () => {
    const parts = url.split("/");
    const type = parts[0]?.toLowerCase();
    const filename = parts[1];

    switch (type) {
      case "solution":
        return fetchGet(`/api/exam/pdf/solution/${filename}/`);
      case "exam":
        return fetchGet(`/api/exam/pdf/exam/${filename}/`);
      case "document":
        return null; // Not yet implemented
      default:
        return null;
    }
  };

  const { loading, data } = useRequest(fetchPdfUrl, {
    cacheKey: `pdf-url-${url}`,
    refreshDeps: [url],
  });

  return {
    loading,
    url: data?.value,
    display_name: data?.display_name,
  };
}

const PdfRenderer: React.FC<PProps> = memo(
  ({ url, refPage, p1X, p1Y, p2X, p2Y }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const myCanvas = useRef<HTMLCanvasElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(DEFAULT_WIDTH);
    const { url: pdfUrl, display_name: pdfDisplayName } = usePdfUrl(url);

    const pdfDeepLink = pdfUrl ? new URL(pdfUrl) : undefined;
    if (pdfDeepLink) {
      pdfDeepLink.hash = `page=${refPage}`;
    }

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

        const canvas = myCanvas.current;
        if (canvas) {
          canvas.height = viewport.height * Math.abs(p1Y - p2Y);
          canvas.width = viewport.width * Math.abs(p1X - p2X);
          page.render({ canvas, viewport });
        }
      };

      renderPdf();

      return () => {
        cancelled = true;
      };
    }, [pdfUrl, refPage, p1X, p1Y, p2X, p2Y, containerWidth]);

    const tooltipLabel = (
      <>
        Click to view{" "}
        <span
          style={{
            fontStyle: "italic",
          }}
        >
          {pdfDisplayName}
        </span>
      </>
    );

    return (
      <>
        <Tooltip target={myCanvas} label={tooltipLabel} />
        <div ref={containerRef} style={{ width: "100%" }}>
          <a href={pdfDeepLink?.href}>
            <canvas ref={myCanvas} />
          </a>
        </div>
      </>
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
  /page: (\d+)\r?\nfrom-relative-coords: \((0.\d+|1|0), (0.\d+|1|0)\)\r?\nto-relative-coords: \((0.\d+|1|0), (0.\d+|1|0)\)\r?\nurl: (\S+)/;

const OfficialSolution: React.FC<Props> = React.memo(({ value }) => {
  const renderedPDF = useMemo(() => {
    if (!value) {
      return <>Invalid Official Solution Syntax: Missing content</>;
    }

    const match = value.match(REGEX);
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
      <PdfRenderer
        url={url}
        refPage={page}
        p1X={p1X}
        p1Y={p1Y}
        p2X={p2X}
        p2Y={p2Y}
      />
    );
  }, [value]);

  return renderedPDF;
});

OfficialSolution.displayName = "OfficialSolution";

export default OfficialSolution;
