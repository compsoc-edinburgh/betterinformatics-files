import * as React from "react";
import { Answer } from "../interfaces";
import Comment from "./comment";
import { css } from "glamor";
import MathText from "./math-text";

interface Props {
  answer: Answer;
}

const styles = {
  wrapper: css({
    border: "1px solid blue",
    marginLeft: "15px",
  }),
};

export default ({ answer }: Props) => (
  <div {...styles.wrapper}>
    <div>
      <b>Answer</b>
    </div>
    <div>Author: {answer.authorId}</div>
    <div>Time: {answer.time}</div>
    <div>Upvotes: {answer.upvotes.length}</div>
    <div>
      Text: <MathText value={answer.text} />
    </div>
    <div>{answer.comments.map(e => <Comment key={e.oid} comment={e} />)}</div>
  </div>
);
