import { useInViewport } from "@umijs/hooks";
import { Card } from "@mantine/core";
import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import { DebugContext } from "../components/Debug";
import IconButton from "../components/icon-button";
import PdfSectionCanvasOverlay from "../components/pdf-section-canvas-overlay";
import PdfSectionText from "../components/pdf-section-text";
import useAlmostInViewport from "../hooks/useAlmostInViewport";
import useDpr from "../hooks/useDpr";
import PDF from "./pdf-renderer";
import { PdfCanvasReference } from "./reference-counting";
import { CutUpdate } from "../interfaces";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import classes from "./pdf-section-canvas.module.css";
import clsx from "clsx";

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
        | Promise<[HTMLCanvasElement, boolean, PdfCanvasReference]>
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
        currentPromise = renderer.renderCanvasSplit(
          pageNumber,
          scale,
          start,
          end,
        );
        const [canvas, isMain, ref] = await currentPromise;
        canvasRef = ref;
        if (cancel) return;
        setIsMainCanvas(isMain);
        setCanvasElement(canvas);
      })();
      return () => {
        cancel = true;
        setCanvasElement(null);

        if (canvasRef) canvasRef.release();
        else if (currentPromise) {
          currentPromise.then(([, , newRef]) => newRef.release());
        }
      };
    }
    return () => undefined;
  }, [shouldRender, renderer, pageNumber, scale, start, end]);
  return [canvasElement, view, width, height, isMainCanvas];
};

interface Props {
  oid?: string;
  page: number;
  start: number;
  end: number;
  renderer: PDF;
  hidden?: boolean;
  targetWidth?: number;
  onInViewChange?: (newInView: boolean) => void;
  onAddCut?: (pos: number) => void;
  addCutText?: string;
  snap?: boolean;
  displayHideShowButtons?: boolean;
  onSectionHiddenChange?: (
    section: string | [number, number],
    update: Partial<CutUpdate>,
  ) => void;
}
const PdfSectionCanvas: React.FC<Props> = React.memo(
  ({
    oid,
    page,
    start,
    end,
    renderer,

    hidden = false,
    targetWidth = 300,
    onInViewChange,
    onAddCut,
    addCutText,
    snap = true,
    displayHideShowButtons = false,
    onSectionHiddenChange = () => {},
  }) => {
    const relativeHeight = end - start;

    const { displayCanvasType } = useContext(DebugContext);
    const [almostInView, containerElement] = useAlmostInViewport<HTMLDivElement>();
    const [containerHeight, setContainerHeight] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [currentScale, setCurrentScale] = useState<number | undefined>(
      undefined,
    );
    const toggleVisibility = useCallback(
      () => onSectionHiddenChange(oid ? oid : [page, end], { hidden: !hidden }),
      [oid, page, end, hidden, onSectionHiddenChange],
    );
    const dpr = useDpr();
    const [canvas, view, width, height, isMainCanvas] = usePdf(
      almostInView || false,
      renderer,
      page,
      start,
      end,
      almostInView ? (currentScale ? currentScale * dpr : undefined) : undefined,
    );
    const [inViewport, inViewportRef] = useInViewport<HTMLDivElement>();
    const v = inViewport || false;
    useEffect(() => {
      if (onInViewChange) onInViewChange(v);
      return () => {
        if (onInViewChange) {
          onInViewChange(false);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [v]);

    const canvasMountingPoint = useCallback<(element: HTMLDivElement) => void>(
      element => {
        if (element === null) return;
        if (canvas === null) return;
        if (isMainCanvas) {
          canvas.style.transform = `translateY(-${translateY}px)`;
        } else {
          canvas.style.transform = "";
        }
        while (element.firstChild) element.removeChild(element.firstChild);
        element.appendChild(canvas);
      },
      [canvas, translateY, isMainCanvas],
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
    }, [
      targetWidth,
      canvas,
      width,
      height,
      isMainCanvas,
      relativeHeight,
      start,
    ]);

    const onAddCutHandler = (pos: number) =>
      onAddCut && onAddCut(start + (end - start) * (pos / containerHeight));

    let content: React.ReactNode;
    if (canvas) {
      content = (
        <div className={classes.canvasWrapper} ref={canvasMountingPoint} />
      );
    } else {
      content = <div />;
    }

    return (
      <Card
        shadow="md"
        p={0}
        className={clsx(end === 1 && classes.lastSection)}
      >
        <div ref={inViewportRef}>
          <div
            style={{
              width: `${targetWidth}px`,
              height: `${
                containerHeight || targetWidth * relativeHeight * 1.414
              }px`,
              filter: hidden ? "contrast(0.5)" : undefined,
            }}
            ref={containerElement}
          >
            {content}
            {displayCanvasType && (
              <div
                className={clsx(
                  isMainCanvas && "bg-success",
                  !isMainCanvas && "bg-info",
                )}
              />
            )}
            {displayHideShowButtons && (
              <div className={classes.addCutButton}>
                <IconButton
                  size="md"
                  icon={hidden ? <IconEye /> : <IconEyeOff />}
                  tooltip="Toggle visibility"
                  onClick={toggleVisibility}
                />
              </div>
            )}
            {almostInView && (
              <PdfSectionText
                page={page}
                start={start}
                end={end}
                renderer={renderer}
                scale={currentScale || 1}
                view={view}
                translateY={translateY}
              />
            )}
            {canvas && addCutText && (
              <PdfSectionCanvasOverlay
                canvas={canvas}
                start={start}
                end={end}
                isMain={isMainCanvas}
                addCutText={addCutText}
                onAddCut={onAddCutHandler}
                snap={snap}
              />
            )}
          </div>
        </div>
      </Card>
    );
  },
);

export default PdfSectionCanvas;
