import { Card, Text, Progress, Anchor, Stack } from "@mantine/core";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import { authenticated, login } from "../api/fetch-utils";
import { SearchResult } from "../hooks/useSearch";
import { CategoryMetaData } from "../interfaces";
import { highlight } from "../utils/search-utils";
import { useStyles } from "../utils/style";

interface Props {
  category: SearchResult<CategoryMetaData> | CategoryMetaData;
}
const CategoryCard: React.FC<Props> = ({ category }) => {
  const { classes } = useStyles();
  const history = useHistory();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.code === "Enter") {
      if (!authenticated()) login(`/category/${category.slug}`);
      else history.push(`/category/${category.slug}`);
    }
  };
  return (
    <Card
      component={Link}
      to={`/category/${category.slug}`}
      onClick={e => {
        if (!authenticated()) {
          e.preventDefault();
          login(`/category/${category.slug}`);
        }
      }}
      withBorder
      shadow="md"
      px="lg"
      py="md"
      className={classes.focusOutline}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Stack h="100%" justify="space-between">
        <div className="category-card">
          <Anchor component="span" weight={700} size="xl" tabIndex={-1} mb={0}>
            {"match" in category
              ? highlight(category.displayname, category.match)
              : category.displayname}
          </Anchor>
          <Text mt="xs">
            Exams:{" "}
            {`${category.examcountanswered} / ${category.examcountpublic}`}
          </Text>
          <Text>
            Answers: {((category.answerprogress * 100) | 0).toString()} %
          </Text>
        </div>
        <Progress radius={0} value={category.answerprogress * 100} />
      </Stack>
    </Card>
  );
};
export default CategoryCard;
