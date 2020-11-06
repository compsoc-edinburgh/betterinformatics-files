import { Card, CardBody, CardFooter, Progress } from "@vseth/components";
import React from "react";
import { useHistory } from "react-router-dom";
import { SearchResult } from "../hooks/useSearch";
import { CategoryMetaData } from "../interfaces";
import { hl } from "../utils/search-utils";
import { focusOutline } from "../utils/style";

interface Props {
  category: SearchResult<CategoryMetaData>;
}
const CategoryCard: React.FC<Props> = ({ category }) => {
  const history = useHistory();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.keyCode === 13) {
      history.push(`/category/${category.slug}`);
    }
  };
  return (
    <Card
      className={focusOutline}
      tabIndex={0}
      onClick={() => history.push(`/category/${category.slug}`)}
      onKeyDown={handleKeyDown}
    >
      <CardBody>
        <h5>{hl(category.displayname, category.match)}</h5>
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
