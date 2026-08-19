import { Box, Flex, type FlexProps, Text } from "@mantine/core";
import { clsx } from "clsx";
import React from "react";
import fadeClasses from "../utils/fade-in-order.module.css";
import classes from "./resource-list.module.css";

export const ResourceList: React.FC<{
  columns: string;
  flush?: boolean;
  children: React.ReactNode;
}> = ({ columns, flush = true, children }) => (
  <Box
    className={clsx(classes.list, flush && classes.flush)}
    // Pass css variable down to rows so they can use it for subgrid
    style={{ "--resource-list-columns": columns }}
  >
    {children}
  </Box>
);

export const ResourceListHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <Box className={classes.headerRow}>{children}</Box>;

export const ResourceListRow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box className={clsx(classes.row, fadeClasses.fadeInOrder)}>{children}</Box>
);

interface ResourceListTitleProps extends FlexProps {
  childNonLinksNeedMouseEvents?: boolean;
  children: React.ReactNode;
}

export const ResourceListTitle: React.FC<ResourceListTitleProps> = ({
  childNonLinksNeedMouseEvents = false,
  children,
  ...props
}) => (
  <Flex
    {...props}
    className={clsx(
      classes.title,
      childNonLinksNeedMouseEvents && classes.childNonLinksNeedMouseEvents,
    )}
  >
    {children}
  </Flex>
);

export const ResourceListEmptyRow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box className={clsx(classes.emptyRow, fadeClasses.fadeInOrder)}>
    <Text c="dimmed" size="sm">
      {children}
    </Text>
  </Box>
);
