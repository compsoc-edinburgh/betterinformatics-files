import { Card, Text, Progress, Anchor, Stack } from "@mantine/core";
import React from "react";
import { cx } from "@emotion/css";
import { Link, useHistory } from "react-router-dom";
import { authenticated } from "../api/fetch-utils";
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
      if (!authenticated()) history.push(`/login/?rd=/category/${category.slug}`);
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
            Exams:{" "}
            {`${category.examcountanswered} / ${category.examcountpublic}`}
          </Text>
          <Text mb={4} color="gray.8">
            Answers: {((category.answerprogress * 100) | 0).toString()} %
          </Text>
        </div>
        <Progress radius={0} value={category.answerprogress * 100} />
      </Stack>
    </Card>
  );
};
export default CategoryCard;
