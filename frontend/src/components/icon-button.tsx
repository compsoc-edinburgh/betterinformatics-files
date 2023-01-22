import { Button, ButtonProps } from "@vseth/components";
import { css } from "@emotion/css";
import React from "react";
import TooltipButton from "./TooltipButton";
import { Loader } from "@mantine/core";
import { Icon } from "vseth-canine-ui";
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
  iconName: string;
  loading?: boolean;
  tooltip?: React.ReactNode;
  iconClassName?: string;
}
const IconButton: React.FC<IconButtonProps> = ({
  size,
  loading,
  iconName,
  className,
  iconClassName,
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
      <>
        <div className={`d-inline-block ${spacerStyle}`}>&nbsp;</div>
        {loading ? (
          <Loader size="sm" />
        ) : (
          <Icon icon={iconName} className={iconClassName} size="1em" />
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
          <Loader size="sm" />
        ) : (
          <Icon icon={iconName} className={iconClassName} size="1em" />
        )}
      </>
      {children && <span className={childStyle}>{children}</span>}
    </Button>
  );
};
export default IconButton;
