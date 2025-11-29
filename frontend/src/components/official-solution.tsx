// import { pdfjs } from 'pdfjs-dist';
import { PDFDocumentLoadingTask } from "pdfjs-dist";
import { getDocument } from "../pdf/pdfjs";
import React, { useMemo, useRef, useEffect, useState } from "react";
import { ComponentRenderer } from "./markdown-text";
import { Tooltip } from "@mantine/core";
import { fetchGet } from "../api/fetch-utils";

interface PProps {
  url: string;
  refPage: number;
  p1X: number;
  p1Y: number;
  p2X: number;
  p2Y: number;
  targetWidth?: number;
}

const PdfRenderer: React.FC<PProps> = React.memo(({
  url,
  refPage,
  p1X,
  p1Y,
  p2X,
  p2Y,
  targetWidth = 500,
}) => {
  const myCanvas = useRef<HTMLCanvasElement>(null);
  const isRendered = useRef(false);
  const [finalurl, setFinalurl] = useState<string>();

  useEffect(() => {
    getUrl(url).then((res) => {
      if (res?.value) {
        setFinalurl(res.value);
      }
    });
  }, [url]);

  useEffect(() => {
    if (!finalurl || isRendered.current || !myCanvas.current) {
      return;
    }

    const renderCanvas = async () => {
      const loadingTask: PDFDocumentLoadingTask = getDocument(finalurl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(Math.min(refPage, pdf.numPages));

      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(
        2.5,
        (0.8 * targetWidth) / (unscaledViewport.width * Math.abs(p1X - p2X))
      );
      const offsetX = -unscaledViewport.width * scale * p1X;
      const offsetY = -unscaledViewport.height * scale * p1Y;
      const viewport = page.getViewport({
        scale: scale,
        offsetX: offsetX,
        offsetY: offsetY,
      });

      if (myCanvas.current) {
        const context = myCanvas.current.getContext("2d");
        if (context) {
          myCanvas.current.height = viewport.height * Math.abs(p1Y - p2Y);
          myCanvas.current.width = viewport.width * Math.abs(p1X - p2X);
          page.render({ canvasContext: context, viewport: viewport });
          isRendered.current = true;
        }
      }
    };

    renderCanvas();
  }, [finalurl, refPage, p1X, p1Y, p2X, p2Y, targetWidth]);

  return (
    <div>
      <canvas ref={myCanvas} />
    </div>
  );
});

PdfRenderer.displayName = "PdfRenderer";

async function getUrl(url: string) {
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
}

/**
 * Hook that returns a memoized languages object for official solutions.
 * This prevents unnecessary re-renders by maintaining referential equality.
 */
export const useOfficialSolutionLanguage = (
  solutionFile?: string,
  targetWidth?: number
): { [key: string]: ComponentRenderer } => {
  return useMemo(
    () => ({
      official: ({ children }) => (
        <OfficialSolution
          value={String(children).replace(/\n$/, "")}
          targetWidth={targetWidth}
        />
      ),
    }),
    [targetWidth]
  );
};

/**
 * @deprecated Use useOfficialSolutionLanguage hook instead to prevent re-renders
 */
export const officialSolutionLanguage = (
  solutionFile?: string,
  targetWidth?: number
): { [key: string]: ComponentRenderer } => {
  return {
    official: ({ children }) => (
      <OfficialSolution
        value={String(children).replace(/\n$/, "")}
        targetWidth={targetWidth}
      />
    ),
  };
};

interface Props {
  value?: string | null;
  targetWidth?: number;
}

const REGEX = /page: (\d+)\r?\nfrom-relative-coords: \((0.\d+|1), (0.\d+|1)\)\r?\nto-relative-coords: \((0.\d+|1), (0.\d+|1)\)\r?\nurl: (\S+)/;

const OfficialSolution: React.FC<Props> = React.memo(({ value, targetWidth }) => {
  const renderedPDF = useMemo(() => {
    if (!value) {
      return <>Invalid Syntax 1</>;
    }

    const match = value.match(REGEX);
    if (!match) {
      return <>Invalid Syntax 3</>;
    }

    const page = parseInt(match[1], 10);
    if (page < 1) {
      return <>Invalid Page</>;
    }

    const p1X = parseFloat(match[2]);
    const p1Y = parseFloat(match[3]);
    const p2X = parseFloat(match[4]);
    const p2Y = parseFloat(match[5]);
    const url = match[6];

    return (
      <Tooltip label="Official Solution">
        <div>
          <PdfRenderer
            url={url}
            refPage={page}
            p1X={p1X}
            p1Y={p1Y}
            p2X={p2X}
            p2Y={p2Y}
            targetWidth={targetWidth}
          />
        </div>
      </Tooltip>
    );
  }, [value, targetWidth]);

  return renderedPDF;
});

OfficialSolution.displayName = "OfficialSolution";

export default OfficialSolution;
