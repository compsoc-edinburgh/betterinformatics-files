import { Badge, Group } from "@mantine/core";
import React, { MouseEventHandler } from "react";
import classes from "./QuickSearchResult.module.css";
import clsx from "clsx";
import { Link } from "react-router-dom";

interface Props {
  isSelected: boolean;
  badge?: string;
  link: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children?: React.ReactElement;
}

export const QuickSearchResult: React.FC<Props> = ({
  isSelected,
  link,
  onClick,
  badge,
  children,
}) => {
  return (
    <Link
      to={link}
      className={clsx(classes.searchResultLink, isSelected && classes.selected)}
      onClick={onClick}
      // Set a HTML attribute that can be queried for scrolling to a selection
      data-quicksearch-selected={isSelected}
    >
      <Group className={clsx(classes.searchResult, classes.fadeHeightLimited)}>
        <>{children}</>
        {badge && (
          <Badge variant="outline" className={classes.badge} my="auto">
            {badge}
          </Badge>
        )}
      </Group>
    </Link>
  );
};
