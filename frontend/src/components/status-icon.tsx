import {
  Tooltip,
  lighten,
  parseThemeColor,
  useMantineTheme,
} from "@mantine/core";
import { IconProps } from "@tabler/icons-react";
import React from "react";
import classes from "./status-icon.module.css";
import { clsx } from "clsx";

interface StatusIconProps extends IconProps {
  tooltip?: React.ReactNode;
  icon: React.ElementType;
}

/** Intended to be used just like IconButton, but without any interaction */
export const StatusIcon: React.FC<StatusIconProps> = ({
  tooltip,
  icon: IconComponent,
  className,
  color,
  ...props
}) => {
  const theme = useMantineTheme();
  const parsedColor = parseThemeColor({ color: color ?? "gray", theme });

  const cssSafeColor = parsedColor.isThemeColor
    ? `var(${parsedColor.variable})`
    : parsedColor.value;
  const lightened = lighten(cssSafeColor, 0.1);
  return (
    <Tooltip withinPortal label={tooltip} disabled={!tooltip}>
      <IconComponent
        {...props}
        className={clsx(className, classes.statusIcon)}
        style={{
          "--status-icon-color": lightened,
          "--status-icon-color-hover": cssSafeColor,
          // Matches ActionIcon's width
          width: "calc(1.375rem * var(--mantine-scale))",
        }}
      />
    </Tooltip>
  );
};
