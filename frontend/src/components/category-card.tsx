import {
  ActionIcon,
  Card,
  Text,
  Progress,
  Anchor,
  LoadingOverlay,
  Stack,
  Tooltip,
  Flex,
} from "@mantine/core";
import React, { useMemo } from "react";
import { IconHeart, IconHeartFilled, IconLock } from "@tabler/icons-react";
import { Link, useHistory } from "react-router-dom";
import { authenticated } from "../api/fetch-utils";
import { SearchResult } from "../hooks/useSearch";
import { CategoryMetaData } from "../interfaces";
import { highlight } from "../utils/search-utils";
import clsx from "clsx";
import classes from "../utils/focus-outline.module.css";
import { useMutation } from "../api/hooks";
import { addNewFavourite, removeFavourite } from "../api/favourite";

interface Props {
  category: SearchResult<CategoryMetaData> | CategoryMetaData;
  onFavouriteToggle: () => void;
}

const pluralize = (count: number, noun: string) =>
  `${count} ${noun}${count !== 1 ? "s" : ""}`;

const CategoryCard: React.FC<Props> = ({ category, onFavouriteToggle: refresh }) => {
  const history = useHistory();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.code === "Enter") {
      if (!authenticated())
        history.push(`/login/?rd=/category/${category.slug}`);
      else history.push(`/category/${category.slug}`);
    }
  };


  const [favouriteLoading, add] = useMutation(addNewFavourite, res => {
    refresh();
  });

  const [favouriteRemoveLoading, remove] = useMutation(removeFavourite, res => {
    refresh();
  });

  // Show a padlock on cards if not authenticated (as determined by a cookie).
  // This is to clearly draw attention to the login form for first-time users.
  // The lock is purely cosmetic, you can still click it but that will make the
  // server actually check auth and redirect you to the login form.
  const lock_titles = useMemo(() => !authenticated(), []);

  const toggleFavourite = (e: React.MouseEvent) => {
    // Prevent the card from navigating to the category page when clicking the
    // favourite button (also while it's loading).
    e.preventDefault();
    if (favouriteLoading || favouriteRemoveLoading) return;
    if (category.favourite) {
      remove(category.slug);
    } else {
      add(category.slug);
    }
  }

  return (
    <Card
      component={Link}
      to={`/category/${category.slug}`}
      onClick={e => {
        if (!authenticated()) {
          e.preventDefault();
          history.push(`/login/?rd=${encodeURIComponent(`/category/${category.slug}`)}`);
        }
      }}
      withBorder
      px="lg"
      py="md"
      className={clsx(classes.focusOutline, classes.hoverShadow)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {lock_titles && (
        // Show a padlock when not logged in, to draw attention to the login form.
        <LoadingOverlay
          visible={true}
          loaderProps={{ children: <IconLock style={{ height: "1.5rem", width: "1.5rem" }} aria-label="Locked" /> }}
        />
      )}
      <Stack h="100%" justify="space-between">
        <div className="category-card" id={category.slug}>
          <Flex justify="space-between">
            <Anchor
              component="span"
              fw={700}
              size="xl"
              tabIndex={-1}
              mb={0}
              lh={1.25}
            >
              {"match" in category
                ? highlight(category.displayname, category.match)
                : category.displayname}
            </Anchor>
            <ActionIcon onClick={toggleFavourite} variant="subtle">
              {category.favourite
                ? <IconHeartFilled aria-label="Favourite" />
                : <IconHeart aria-label="Favourite" />}
            </ActionIcon>
          </Flex>
          <Text mt={4} c="gray.8">
            {pluralize(category.documentcount, "Community Document")}
          </Text>
          <Text c="gray.8">
            {pluralize(category.examcountpublic, "Exam")}
          </Text>
          <Text mb={4} c="gray.8">
            {((category.answerprogress * 100) | 0).toString()} % Solved by
            community
          </Text>
        </div>
        <Tooltip label={`${((category.answerprogress * 100) | 0).toString()} %`}>
          <Progress radius={0} value={category.answerprogress * 100} />
        </Tooltip>
      </Stack>
    </Card>
  );
};
export default CategoryCard;
