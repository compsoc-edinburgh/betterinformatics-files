import { Card, CardBody, CardFooter, Progress } from "@vseth/components";
import React from "react";
import { useHistory, Link } from "react-router-dom";
import { SearchResult } from "../hooks/useSearch";
import { CategoryMetaData } from "../interfaces";
import { highlight } from "../utils/search-utils";
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
    <Card className={focusOutline} tabIndex={0} onKeyDown={handleKeyDown}>
      <CardBody>
        <Link to={`/category/${category.slug}`} className="stretched-link">
          <h5>{highlight(category.displayname, category.match)}</h5>
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
