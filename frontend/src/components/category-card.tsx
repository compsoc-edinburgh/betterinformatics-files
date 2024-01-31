import {
  Card,
  Text,
  Progress,
  Anchor,
  LoadingOverlay,
  Stack,
} from "@mantine/core";
import React, { useMemo } from "react";
import { cx } from "@emotion/css";
import { Link, useHistory } from "react-router-dom";
import { authenticated } from "../api/fetch-utils";
import { SearchResult } from "../hooks/useSearch";
import { CategoryMetaData } from "../interfaces";
import { highlight } from "../utils/search-utils";
import { useStyles } from "../utils/style";
import { Icon, ICONS } from "vseth-canine-ui";

interface Props {
  category: SearchResult<CategoryMetaData> | CategoryMetaData;
}

const pluralize = (count: number, noun: string) =>
  `${count} ${noun}${count !== 1 ? "s" : ""}`;

const CategoryCard: React.FC<Props> = ({ category }) => {
  const { classes } = useStyles();
  const history = useHistory();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.code === "Enter") {
      if (!authenticated())
        history.push(`/login/?rd=/category/${category.slug}`);
      else history.push(`/category/${category.slug}`);
    }
  };

  // Show a padlock on cards if not authenticated (as determined by a cookie).
  // This is to clearly draw attention to the login form for first-time users.
  // The lock is purely cosmetic, you can still click it but that will make the
  // server actually check auth and redirect you to the login form.
  const lock_titles = useMemo(() => !authenticated(), []);

  return (
    <Card
      component={Link}
      to={`/category/${category.slug}`}
      onClick={e => {
        if (!authenticated()) {
          e.preventDefault();
          history.push(`/login/?rd=/category/${category.slug}`);
        }
      }}
      withBorder
      px="lg"
      py="md"
      className={cx(classes.focusOutline, classes.hoverShadow)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {lock_titles && (
        // Show a padlock when not logged in, to draw attention to the login form.
        <LoadingOverlay
          visible={true}
          loader={<Icon icon={ICONS.LOCK} size="1.5rem" aria-label="Locked" />}
        />
      )}
      <Stack h="100%" justify="space-between">
        <div className="category-card">
          <Anchor
            component="span"
            weight={700}
            size="xl"
            tabIndex={-1}
            mb={0}
            lh={1.25}
          >
            {"match" in category
              ? highlight(category.displayname, category.match)
              : category.displayname}
          </Anchor>
          <Text mt={4} color="gray.8">
            {pluralize(category.documentcount, "Community Document")}
          </Text>
          <Text color="gray.8">
            {pluralize(category.examcountpublic, "Exam")}
          </Text>
          <Text mb={4} color="gray.8">
            {((category.answerprogress * 100) | 0).toString()} % Solved by
            community
          </Text>
        </div>
        <Progress radius={0} value={category.answerprogress * 100} />
      </Stack>
    </Card>
  );
};
export default CategoryCard;
