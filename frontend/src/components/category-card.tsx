import { Card, CardBody, CardFooter, Progress } from "@vseth/components";
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
    <Card className={focusOutline} tabIndex={0} onKeyDown={handleKeyDown}>
      <CardBody>
        <Link
          to={`/category/${category.slug}`}
          onClick={e => {
            if (!authenticated()) {
              e.preventDefault();
              login(`/category/${category.slug}`);
            }
          }}
          className="stretched-link text-dark"
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
      </CardBody>
      <CardFooter>
        <Progress value={category.answerprogress} max={1} />
      </CardFooter>
    </Card>
  );
};
export default CategoryCard;
