import { Card, CardBody, CardFooter, Progress } from "@vseth/components";
import React from "react";
import { useHistory } from "react-router-dom";
import { CategoryMetaData } from "../interfaces";
import { focusOutline } from "../utils/style";

const CategoryCard: React.FC<{ category: CategoryMetaData }> = ({
  category,
}) => {
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
        <h5>{category.displayname}</h5>
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
