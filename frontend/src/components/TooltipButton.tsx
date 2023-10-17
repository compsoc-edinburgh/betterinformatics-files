import { ButtonProps, Button, Tooltip } from "@mantine/core";
import React, { useState, useEffect } from "react";

export interface TooltipButtonProps extends ButtonProps {
  tooltip?: React.ReactNode;
  onClick?: any;
}
const TooltipButton: React.FC<TooltipButtonProps> = ({
  tooltip,
  onClick,
  children,
  ...buttonProps
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      {mounted && tooltip && (
        <Tooltip
          label={tooltip}
          withArrow
          withinPortal
        >
          <Button
            variant="default"
            {...buttonProps}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </Button>
        </Tooltip>
      )}
    </>
  );
};
export default TooltipButton;
