import { Card, CardBody, CardFooter, Progress } from "@vseth/components";
import React from "react";
import { CategoryMetaData } from "../interfaces";
import TextLink from "./text-link";

const CategoryCard: React.FC<{ category: CategoryMetaData }> = ({
  category,
}) => {
  return (
    <TextLink to={`category/${category.slug}`} style={{ color: "black" }}>
      <Card>
        <CardBody>
          <h5>{category.category}</h5>
          <div>
            Exams:{" "}
            {`${category.examcountanswered} / ${category.examcountpublic}`}
          </div>
          <div>Answers: {(category.answerprogress * 100).toString()} %</div>
        </CardBody>
        <CardFooter>
          <Progress value={category.answerprogress} max={1} />
        </CardFooter>
      </Card>
    </TextLink>
  );
};
export default CategoryCard;
