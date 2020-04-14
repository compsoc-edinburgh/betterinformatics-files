import { useRef, useCallback } from "react";
const noUserSelect = `
  *:not(input):not(textarea) {
    user-select: none !important;
    -webkit-user-select: none !important;
    -webkit-touch-callout: none !important;
  }
`;
let node: HTMLStyleElement | undefined;
const createStyle = () => {
  node = document.createElement("style");
  node.innerHTML = noUserSelect;
  // document.head.appendChild(node);
};
const removeStyle = () => {
  if (node && document.head === node.parentElement)
    document.head.removeChild(node);
};
type Point = [number, number];
const useLongPress = <T>(
  onHold: () => void,
  onClick: (e: React.MouseEvent<T>) => void,
  longPressTime: number = 500,
  longPressDistanceSq: number = 20,
) => {
  const timer = useRef<number | undefined>();
  const pos = useRef<Point>([0, 0]);
  const handler = useCallback(() => {
    timer.current = undefined;
    onHold();
  }, [timer, onHold]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<T>) => {
      e.preventDefault();
      pos.current = [e.clientX, e.clientY];
      const timeoutId = window.setTimeout(handler, longPressTime);
      createStyle();
      timer.current = timeoutId;
    },
    [handler, longPressTime, pos, timer],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<T>) => {
      removeStyle();
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
        onClick(e);
      }
    },
    [timer, onClick],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (timer) {
        const [x, y] = pos.current;
        const d = (e.clientX - x) ** 2 + (e.clientY - y) ** 2;
        if (d > longPressDistanceSq) {
          window.clearTimeout(timer.current);
          timer.current = undefined;
        }
      }
    },
    [timer, pos, longPressDistanceSq],
  );
  return { onPointerDown, onPointerUp, onPointerMove } as const;
};

export default useLongPress;
