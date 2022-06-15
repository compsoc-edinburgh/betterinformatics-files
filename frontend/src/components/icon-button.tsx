import { Button, Spinner, ButtonProps } from "@vseth/components";
import { css } from "@emotion/css";
import React from "react";
import TooltipButton from "./TooltipButton";
const childStyle = css`
  padding-left: 0.8em;
`;
const buttonStyle = css`
  min-width: 0;
  align-content: center;
`;
const spacerStyle = css`
  width: 0;
`;
interface IconButtonProps extends ButtonProps {
  icon: React.FC<{ className?: string; size?: string | number }>;
  loading?: boolean;
  tooltip?: React.ReactNode;
  iconClassName?: string;
}
const IconButton: React.FC<IconButtonProps> = ({
  size,
  loading,
  icon,
  className,
  iconClassName,
  disabled,
  children,
  tooltip,
  ...props
}) => {
  const Icon = icon;
  return tooltip ? (
    <TooltipButton
      tooltip={tooltip}
      {...props}
      disabled={disabled || loading}
      className={buttonStyle + (className ? ` ${className}` : "")}
      size={size}
    >
      <>
        <div className={`d-inline-block ${spacerStyle}`}>&nbsp;</div>
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <Icon className={iconClassName} size="1em" />
        )}
      </>
      {children && <span className={childStyle}>{children}</span>}
    </TooltipButton>
  ) : (
    <Button
      {...props}
      disabled={disabled || loading}
      className={buttonStyle + (className ? ` ${className}` : "")}
      size={size}
    >
      <>
        <div className={`d-inline-block ${spacerStyle}`}>&nbsp;</div>
        {loading ? (
          <Spinner size="sm" s />
        ) : (
          <Icon className={iconClassName} size="1em" />
        )}
      </>
      {children && <span className={childStyle}>{children}</span>}
    </Button>
  );
};
export default IconButton;
