import { ActionIconProps, ActionIcon, Tooltip } from "@mantine/core";
import React from "react";
import classes from "./icon-button.module.css";
import clsx from "clsx";

interface IconButtonProps extends ActionIconProps {
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: React.ReactNode;
  onClick?: any;
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
    <Tooltip
      withinPortal
      label={tooltip}
      disabled={disabled || loading}
      className={clsx(classes.button, className && className)}
    >
      <ActionIcon variant="light" loading={loading} size={size} {...props}>
        {icon}
      </ActionIcon>
    </Tooltip>
  ) : (
    <ActionIcon
      variant="light"
      {...props}
      disabled={disabled || loading}
      className={clsx(classes.button, className && className)}
      size={size}
      loading={loading}
    >
      {icon}
    </ActionIcon>
  );
};
export default IconButton;
