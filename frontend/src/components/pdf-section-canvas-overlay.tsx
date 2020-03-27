import { Badge } from "@vseth/components";
import React, { useCallback, useRef, useState } from "react";
interface Props {
  onAddCut: (pos: number) => void;
  addCutText?: string;
}
const PdfSectionCanvasOverlay: React.FC<Props> = ({ onAddCut, addCutText }) => {
  const [clientY, setClientY] = useState<number | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);
  const pointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setClientY(e.clientY);
  }, []);
  const leave = useCallback(() => setClientY(undefined), []);

  const pos =
    ref.current && clientY
      ? clientY - ref.current.getBoundingClientRect().top
      : undefined;
  const onAdd = () => pos && onAddCut(pos);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: "0",
        cursor: "pointer",
      }}
      onPointerMove={pointerMove}
      onPointerLeave={leave}
      ref={ref}
      onClick={onAdd}
    >
      {pos !== undefined && (
        <>
          <div
            className="border-top border-primary"
            style={{
              transform: `translateY(${pos}px)`,
              position: "absolute",
              width: "100%",
              margin: 0,
            }}
            id="add-cut"
          >
            <Badge
              color="primary"
              size="lg"
              style={{
                position: "absolute",
                top: "0",
                transform: "translateY(-50%)",
              }}
            >
              {addCutText}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
};
export default PdfSectionCanvasOverlay;
