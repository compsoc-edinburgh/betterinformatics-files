import { useInViewport } from "@umijs/hooks";
import { Card } from "@vseth/components";
import { css } from "glamor";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import useDpr from "../hooks/useDpr";
import { PdfSection } from "../interfaces";
import PDF, {
  CanvasObject,
  PdfCanvasReference,
  PdfCanvasReferenceManager,
} from "../pdf-renderer";
import PdfSectionText from "./pdf-section-text";
const styles = {
  lastSection: css({
    marginBottom: "40px",
  }),
};

const usePdf = (
  shouldRender: boolean,
  renderer: PDF,
  pageNumber: number,
  start: number,
  end: number,
  scale: number | undefined,
): [
  HTMLCanvasElement | null,
  number[] | undefined,
  number,
  number,
  boolean,
] => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  );
  const [view, setView] = useState<number[]>();
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [isMainCanvas, setIsMainCanvas] = useState(false);
  useEffect(() => {
    if (shouldRender) {
      let cancel = false;
      let canvasRef: PdfCanvasReference | undefined;
      let currentPromise:
        | Promise<
            [
              Promise<void>,
              CanvasObject,
              PdfCanvasReferenceManager,
              PdfCanvasReference,
            ]
          >
        | undefined;
      (async () => {
        const page = await renderer.getPage(pageNumber);
        if (cancel) return;
        setView(page.view);
        const viewport = page.getViewport({ scale: 1.0 });
        setWidth(viewport.width);
        setHeight(viewport.height);
        if (scale === undefined) {
          return;
        }
        currentPromise = renderer.getMainCanvas(pageNumber, scale);
        const [, canvasObject, , ref] = await currentPromise;
        canvasRef = ref;
        if (cancel) return;
        setIsMainCanvas(true);
        setCanvasElement(canvasObject.canvas);
      })();
      return () => {
        cancel = true;
        setCanvasElement(null);
        if (canvasRef) canvasRef.release();
        else if (currentPromise) {
          currentPromise.then(([, , , newCanvasRef]) => newCanvasRef.release());
        }
      };
    }
    return () => undefined;
  }, [shouldRender, renderer, pageNumber, scale, start, end]);
  return [canvasElement, view, width, height, isMainCanvas];
};

interface Props {
  section: PdfSection;
  renderer: PDF;
  targetWidth: number;
}
const PdfSectionCanvas: React.FC<Props> = ({
  section,
  renderer,
  targetWidth,
}) => {
  const start = section.start.position;
  const end = section.end.position;
  const relativeHeight = end - start;
  const pageNumber = section.start.page;

  const [visible, containerElement] = useInViewport<HTMLDivElement>();
  const [containerHeight, setContainerHeight] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [currentScale, setCurrentScale] = useState<number | undefined>(
    undefined,
  );
  const dpr = useDpr();
  const [canvas, view, width, height, isMainCanvas] = usePdf(
    visible || false,
    renderer,
    pageNumber,
    start,
    end,
    visible ? (currentScale ? currentScale * dpr : undefined) : undefined,
  );

  const canvasMountingPoint = useCallback<(element: HTMLDivElement) => void>(
    element => {
      if (element === null) return;
      if (canvas === null) return;
      while (element.firstChild) element.removeChild(element.firstChild);
      element.appendChild(canvas);
    },
    [canvas],
  );

  useEffect(() => {
    if (width === 0) return;
    const scaling = targetWidth / width;
    setCurrentScale(scaling);
    const newHeight = height * scaling;
    setContainerHeight(relativeHeight * newHeight);
    setTranslateY(start * newHeight);
    if (canvas === null) return;
    if (isMainCanvas) {
      canvas.style.transform = `translateY(-${start * newHeight}px)`;
    } else {
      canvas.style.transform = "";
    }
  }, [targetWidth, canvas, width, height, isMainCanvas, relativeHeight, start]);

  let content: React.ReactNode;
  if (canvas) {
    content = <div ref={canvasMountingPoint} />;
  } else {
    content = <div />;
  }

  return (
    <Card {...(end === 1 ? styles.lastSection : undefined)}>
      <div
        style={{
          width: `${targetWidth}px`,
          height: `${containerHeight ||
            targetWidth * relativeHeight * 1.414}px`,
          position: "relative",
          overflow: "hidden",
        }}
        ref={containerElement}
      >
        {content}
        {visible && (
          <PdfSectionText
            section={section}
            renderer={renderer}
            scale={currentScale || 1}
            view={view}
            translateY={translateY}
          />
        )}
      </div>
    </Card>
  );
};

export default PdfSectionCanvas;
