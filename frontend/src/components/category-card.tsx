import { Card, Text, Progress, Anchor } from "@mantine/core";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import { authenticated, login } from "../api/fetch-utils";
import { SearchResult } from "../hooks/useSearch";
import { CategoryMetaData } from "../interfaces";
import { highlight } from "../utils/search-utils";
import { focusOutline } from "../utils/style";

interface Props {
  category: SearchResult<CategoryMetaData> | CategoryMetaData;
}
const CategoryCard: React.FC<Props> = ({ category }) => {
  const history = useHistory();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.keyCode === 13) {
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
      padding="lg"
      className={focusOutline}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Anchor
        // color="gray.9"
        weight={700}
        size="xl"
        className="stretched-link"
        tabIndex={-1}
        mb={0}
      >
        {"match" in category
          ? highlight(category.displayname, category.match)
          : category.displayname}
      </Anchor>
      <Text mt="xs">
        Exams: {`${category.examcountanswered} / ${category.examcountpublic}`}
      </Text>
      <Text>Answers: {((category.answerprogress * 100) | 0).toString()} %</Text>
      <Progress radius={0} value={category.answerprogress * 100} mt="sm" />
    </Card>
  );
};
export default CategoryCard;
