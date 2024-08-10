import { Card, Text, Progress, Anchor, Stack, Tooltip } from "@mantine/core";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import { authenticated, login } from "../api/fetch-utils";
import { SearchResult } from "../hooks/useSearch";
import { CategoryMetaData } from "../interfaces";
import { highlight } from "../utils/search-utils";
import classes from "../utils/focus-outline.module.css";

interface Props {
  category: SearchResult<CategoryMetaData> | CategoryMetaData;
}
const CategoryCard: React.FC<Props> = ({ category }) => {
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
        <div className="category-card" id={category.slug}>
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
          <Text mt={4}>
            {`Exams: ${category.examcountpublic}`}
          </Text>
          <Text mb={4}>
            {`Documents: ${category.documentcount}`}
          </Text>
        </div>
        <Tooltip label={`Answers: ${((category.answerprogress * 100) | 0).toString()} %`}>
          <Progress radius={0} value={category.answerprogress * 100} />
        </Tooltip>
      </Stack>
    </Card>
  );
};
export default CategoryCard;
