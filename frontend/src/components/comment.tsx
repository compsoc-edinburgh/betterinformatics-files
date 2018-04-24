import * as React from "react";
import { Comment } from "../interfaces";
import { css } from "glamor";
import MathText from "./math-text";

interface Props {
  comment: Comment;
}

const styles = {
  wrapper: css({
    border: "1px solid red",
    marginLeft: "15px",
  }),
};

export default ({ comment }: Props) => (
  <div {...styles.wrapper}>
    <div>
      <b>Comment</b>
    </div>
    <div>Author: {comment.authorId}</div>
    <div>Time: {comment.time}</div>
    <div>
      Text: <MathText value={comment.text} />
    </div>
  </div>
);
