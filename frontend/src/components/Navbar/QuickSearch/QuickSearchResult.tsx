import { Badge, Group } from "@mantine/core"
import React from "react"
import classes from "./QuickSearchResult.module.css";
import clsx from "clsx";
import { Link } from "react-router-dom";

interface Props {
  isSelected: boolean,
  badge: string,
  link: string,
  children?: React.ReactElement,
}

export const QuickSearchResult: React.FC<Props> = ({ isSelected, link, badge, children }) => {
  return (
    <Link to={link} className={classes.searchResultLink}>
      <Group className={clsx(classes.searchResult, classes.fadeHeightLimited, isSelected && classes.selected)}>
        <>
          {children}
        </>
        <Badge variant="outline" className={classes.badge}>{badge}</Badge>
      </Group>
    </Link>
  )
}
