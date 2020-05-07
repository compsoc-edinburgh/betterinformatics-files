import { Button, Icon, ICONS, Spinner, ButtonProps } from "@vseth/components";
import { css } from "emotion";
import React from "react";
import TooltipButton from "./TooltipButton";
const childStyle = css`
  padding-left: 0.8em;
`;
const buttonStyle = css`
  min-width: 0;
  align-content: center;
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
  className,
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
      className={buttonStyle + (className ? ` ${className}` : "")}
      size={size}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        <Icon icon={ICONS[icon]} size="1em" />
      )}
      {children && <span className={childStyle}>{children}</span>}
    </TooltipButton>
  ) : (
    <Button
      {...props}
      disabled={disabled || loading}
      className={buttonStyle + (className ? ` ${className}` : "")}
      size={size}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        <Icon icon={ICONS[icon]} size="1em" />
      )}
      {children && <span className={childStyle}>{children}</span>}
    </Button>
  );
};
export default IconButton;
