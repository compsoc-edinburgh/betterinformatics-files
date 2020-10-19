import { Card, CardBody, CardFooter, Progress } from "@vseth/components";
import React from "react";
import { useHistory } from "react-router-dom";
import { CategoryMetaData } from "../interfaces";
import { focusOutline } from "../utils/style";
import Fuse from "fuse.js";
import { useMemo } from "react";
import { css } from "emotion";

const getMatch = (result: Fuse.FuseResult<CategoryMetaData>, key: string) => {
  return result.matches?.find(e => e.key === key)?.indices;
};
const processMatch = (
  m: readonly Fuse.RangeTuple[] | undefined,
  value: string,
): Array<[string, boolean]> => {
  if (m === undefined) return [[value, false]];
  const res: Array<[string, boolean]> = [];
  let last = 0;
  for (const [start, end] of m) {
    if (start > last) res.push([value.substring(last, start), false]);
    res.push([value.substring(start, end + 1), true]);
    last = end + 1;
  }
  if (value.length > last)
    res.push([value.substring(last, value.length), false]);
  return res;
};

const highlighted = css`
  background-color: var(--yellow);
`;

interface Props {
  category: Fuse.FuseResult<CategoryMetaData>;
}
const CategoryCard: React.FC<Props> = ({ category }) => {
  const history = useHistory();
  const m = useMemo(
    () =>
      processMatch(
        getMatch(category, "displayname"),
        category.item.displayname,
      ),
    [category],
  );
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.keyCode === 13) {
      history.push(`/category/${category.item.slug}`);
    }
  };
  return (
    <Card
      className={focusOutline}
      tabIndex={0}
      onClick={() => history.push(`/category/${category.item.slug}`)}
      onKeyDown={handleKeyDown}
    >
      <CardBody>
        <h5>
          {m.map(([str, isMatch], i) => (
            <span key={i} className={isMatch ? highlighted : undefined}>
              {str}
            </span>
          ))}
        </h5>
        <div>
          Exams:{" "}
          {`${category.item.examcountanswered} / ${category.item.examcountpublic}`}
        </div>
        <div>
          Answers: {((category.item.answerprogress * 100) | 0).toString()} %
        </div>
      </CardBody>
      <CardFooter>
        <Progress value={category.item.answerprogress} max={1} />
      </CardFooter>
    </Card>
  );
};
export default CategoryCard;
