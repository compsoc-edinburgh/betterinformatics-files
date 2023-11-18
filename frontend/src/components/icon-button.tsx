import { ActionIconProps, ActionIcon, Tooltip } from "@mantine/core";
import { css } from "@emotion/css";
import React from "react";
import { Icon } from "vseth-canine-ui";

const buttonStyle = css`
  min-width: 0;
  align-content: center;
`;

interface IconButtonProps extends ActionIconProps {
  iconName: string;
  loading?: boolean;
  tooltip?: React.ReactNode;
  iconClassName?: string;
  onClick?: any;
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
    <Tooltip
      withinPortal
      label={tooltip}
      disabled={disabled || loading}
      className={buttonStyle + (className ? ` ${className}` : "")}
    >
      <ActionIcon loading={loading} size={size} {...props}>
        <Icon icon={iconName} className={iconClassName} size="1em" />
      </ActionIcon>
    </Tooltip>
  ) : (
    <ActionIcon
      {...props}
      disabled={disabled || loading}
      className={buttonStyle + (className ? ` ${className}` : "")}
      size={size}
      loading={loading}
    >
      <Icon icon={iconName} className={iconClassName} size="1em" />
    </ActionIcon>
  );
};
export default IconButton;
