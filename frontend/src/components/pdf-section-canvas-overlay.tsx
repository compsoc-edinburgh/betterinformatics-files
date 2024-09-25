import { Badge } from "@mantine/core";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import { determineOptimalCutPositions } from "../pdf/snap";
import { DebugContext } from "./Debug";
import classes from "./pdf-section-canvas-overlay.module.css";

interface Props {
  canvas: HTMLCanvasElement;
  start: number;
  end: number;
  isMain: boolean;

  onAddCut: (pos: number) => void;
  addCutText?: string;
  snap?: boolean;
}
const PdfSectionCanvasOverlay: React.FC<Props> = React.memo(
  ({ canvas, start, end, isMain, onAddCut, addCutText, snap = true }) => {
    const { viewOptimalCutAreas } = useContext(DebugContext);
    const [clientY, setClientY] = useState<number | undefined>(undefined);
    const ref = useRef<HTMLDivElement>(null);
    const pointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      setClientY(e.clientY);
    }, []);
    const leave = useCallback(() => setClientY(undefined), []);

    const height = ref.current?.getBoundingClientRect().height;
    const pos =
      ref.current && clientY
        ? clientY - ref.current.getBoundingClientRect().top
        : undefined;

    const optimalCutAreas = useMemo(
      () => determineOptimalCutPositions(canvas, start, end, isMain),
      [canvas, start, end, isMain],
    );
    const relPos = pos !== undefined && height ? pos / height : undefined;
    const [relSnapPos, bad] =
      relPos !== undefined && ref.current
        ? optimalCutAreas
            .flatMap(area => area.snapPoints)
            .reduce(
              ([prev, prevBad], snap) =>
                Math.abs(snap - relPos) < Math.abs(prev - relPos)
                  ? [snap, Math.abs(snap - relPos)]
                  : [prev, prevBad],
              [0, Infinity],
            )
        : [0, Infinity];
    const snapPos = height ? relSnapPos * height : undefined;
    const snapBad = !snap || bad * (end - start) > 0.03;
    const displayPos = snapBad ? pos : snapPos;
    const onAdd = () => {
      if (displayPos === undefined) return;
      if (displayPos < 0) return;
      if (height === undefined || displayPos > height) return;
      displayPos && onAddCut(displayPos);
    };
    return (
      <div
        className={classes.wrapper}
        onPointerMove={pointerMove}
        onPointerLeave={leave}
        ref={ref}
        onPointerUp={onAdd}
      >
        {viewOptimalCutAreas &&
          optimalCutAreas.map(({ start, end, snapPoints }) => (
            <React.Fragment key={`${start}-${end}`}>
              <div
                style={{
                  top: `${start * 100}%`,
                  height: `${(end - start) * 100}%`,
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              />
              {snapPoints.map(position => (
                <div
                  key={position}
                  style={{
                    height: "1px",
                    backgroundColor: "blue",
                    top: `${position * 100}%`,
                  }}
                />
              ))}
            </React.Fragment>
          ))}
        {displayPos !== undefined && (
          <div
            style={{
              transform: `translateY(${displayPos}px) translateY(-50%)`,
              backgroundColor: snap && snapBad ? "red" : "var(--mantine-color-text)",
              height: "3px",
              position: "absolute",
              width: "100%",
              margin: 0,
            }}
            id="add-cut"
          >
            <Badge
              color={snap && snapBad ? "red" : "var(--mantine-color-text)"}
              size="lg"
              className={classes.badge}
              variant="filled"
            >
              {addCutText}
            </Badge>
          </div>
        )}
      </div>
    );
  },
);
export default PdfSectionCanvasOverlay;
