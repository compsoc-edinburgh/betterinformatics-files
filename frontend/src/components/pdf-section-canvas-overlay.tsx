import { Badge } from "@vseth/components";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import { determineOptimalCutPositions } from "../pdf/snap";
import { css } from "emotion";
import { DebugContext } from "./Debug";

const wrapperStyle = css`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  touch-action: none;
  user-select: none;
  cursor: pointer;
`;
const badgeStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-50%);
`;

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
        className={wrapperStyle}
        onPointerMove={pointerMove}
        onPointerLeave={leave}
        ref={ref}
        onPointerUp={onAdd}
      >
        {viewOptimalCutAreas &&
          optimalCutAreas.map(({ start, end, snapPoints }) => (
            <React.Fragment key={`${start}-${end}`}>
              <div
                className="position-absolute w-100"
                style={{
                  top: `${start * 100}%`,
                  height: `${(end - start) * 100}%`,
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              />
              {snapPoints.map(position => (
                <div
                  key={position}
                  className="position-absolute w-100 m-0"
                  style={{
                    height: "1px",
                    backgroundColor: "var(--info)",
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
              backgroundColor:
                snap && snapBad ? "var(--warning)" : "var(--primary)",
              height: "3px",
              position: "absolute",
              width: "100%",
              margin: 0,
            }}
            id="add-cut"
          >
            <Badge
              color={snap && snapBad ? "warning" : "primary"}
              size="lg"
              className={badgeStyle}
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
