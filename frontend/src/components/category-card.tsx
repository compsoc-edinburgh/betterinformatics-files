import { Card, CardBody, CardFooter, Progress } from "@vseth/components";
import React from "react";
import { CategoryMetaData } from "../interfaces";
import { useHistory } from "react-router-dom";
import styled from "@emotion/styled";

const CategoryCardWrapper = styled(Card)`
  cursor: pointer;
`;

const CategoryCard: React.FC<{ category: CategoryMetaData }> = ({
  category,
}) => {
  const history = useHistory();
  return (
    <CategoryCardWrapper
      onClick={() => history.push(`/category/${category.slug}`)}
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
    </CategoryCardWrapper>
  );
};
export default CategoryCard;
