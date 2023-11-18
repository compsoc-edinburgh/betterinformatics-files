import { ButtonProps, Button, Tooltip } from "@mantine/core";
import React from "react";

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
  return (
    <>
      {tooltip && (
        <Tooltip label={tooltip} withArrow withinPortal>
          <Button variant="default" {...buttonProps} onClick={onClick}>
            {children}
          </Button>
        </Tooltip>
      )}
    </>
  );
};
export default TooltipButton;
