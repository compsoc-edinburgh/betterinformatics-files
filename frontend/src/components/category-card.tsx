import { Card, Stack, Progress } from "@mantine/core";
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
      withBorder
      shadow="md"
      className={focusOutline}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Stack mb="sm" spacing="sm">
        <Link
          to={`/category/${category.slug}`}
          onClick={e => {
            if (!authenticated()) {
              e.preventDefault();
              login(`/category/${category.slug}`);
            }
          }}
          className="stretched-link text-dark"
	  tabIndex={-1}
        >
          <h5>
            {"match" in category
              ? highlight(category.displayname, category.match)
              : category.displayname}
          </h5>
        </Link>
        <div>
          Exams: {`${category.examcountanswered} / ${category.examcountpublic}`}
        </div>
        <div>Answers: {((category.answerprogress * 100) | 0).toString()} %</div>
      </Stack>
      <Card.Section>
        <Progress radius={0} value={category.answerprogress * 100} />
      </Card.Section>
    </Card>
  );
};
export default CategoryCard;
