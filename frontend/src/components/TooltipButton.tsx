import { useClickAway } from "@umijs/hooks";
import { ButtonProps } from "@vseth/components";
import { Button, Tooltip } from "@mantine/core";
import React, { useCallback, useState, useContext, useEffect } from "react";
import useLongPress from "../hooks/useLongPress";
import { DebugContext } from "./Debug";

function detectMobile() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  return toMatch.some(toMatchItem => {
    return navigator.userAgent.match(toMatchItem);
  });
}
const isMobile = detectMobile();

export interface TooltipButtonProps extends ButtonProps {
  tooltip?: React.ReactNode;
}
const TooltipButton: React.FC<TooltipButtonProps> = ({
  tooltip,
  onClick,
  children,
  ...buttonProps
}) => {
  const { displayAllTooltips } = useContext(DebugContext);
  const [open, setState] = useState(false);
  const toggle = useCallback(() => setState(a => !a), []);
  const longPress = useLongPress(
    () => isMobile && setState(true),
    onClick ?? (() => { }),
  );
  const ref = useClickAway(() => setState(false));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      {mounted && tooltip && (
        <Tooltip
          label={tooltip}
          withArrow
          openDelay={400}
          closeDelay={100}
          withinPortal
        // isOpen={open || displayAllTooltips}
        // toggle={() => !isMobile && toggle()}
        >
          <Button
            variant="outline"
            {...longPress}
            {...buttonProps}
            onClick={e => e.stopPropagation()}
          >
            <span ref={ref} /> {children}
          </Button>
        </Tooltip>
      )}
    </>
  );
};
export default TooltipButton;
