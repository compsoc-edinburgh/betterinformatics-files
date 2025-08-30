import { Badge, Group } from "@mantine/core"
import React from "react"
import classes from "./QuickSearchResult.module.css";
import clsx from "clsx";

interface Props {
  isSelected: boolean,
  badge: string,
  children?: React.ReactElement,
}

export const QuickSearchResult: React.FC<Props> = ({ isSelected, badge, children }) => {
  return (
    <Group className={clsx(classes.searchResult, classes.fadeHeightLimited, isSelected && classes.selected)}>
      <>
        {children}
      </>
      <Badge variant="outline" className={classes.badge}>{badge}</Badge>
    </Group>
  )
}
