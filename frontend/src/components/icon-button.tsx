import { Button, Icon, ICONS, Spinner, ButtonProps } from "@vseth/components";
import { css } from "emotion";
import React from "react";
import TooltipButton from "./TooltipButton";
const childStyle = css`
  padding-left: 0.8em;
`;
interface IconButtonProps extends ButtonProps {
  icon: keyof typeof ICONS;
  loading?: boolean;
  tooltip?: React.ReactNode;
}
const IconButton: React.FC<IconButtonProps> = ({
  size,
  loading,
  icon,
  disabled,
  children,
  tooltip,
  ...props
}) => {
  return tooltip ? (
    <TooltipButton
      tooltip={tooltip}
      {...props}
      disabled={disabled || loading}
      style={{ minWidth: 0, height: "100%", display: "initial" }}
      size={size}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        <>
          <Icon icon={ICONS[icon]} size={size === "lg" ? 20 : 18} />
        </>
      )}
      {children && <span className={childStyle}>{children}</span>}
    </TooltipButton>
  ) : (
    <Button
      {...props}
      disabled={disabled || loading}
      style={{ minWidth: 0, height: "100%", display: "initial" }}
      size={size}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        <>
          <Icon icon={ICONS[icon]} size={size === "lg" ? 20 : 18} />
        </>
      )}
      {children && <span className={childStyle}>{children}</span>}
    </Button>
  );
};
export default IconButton;
