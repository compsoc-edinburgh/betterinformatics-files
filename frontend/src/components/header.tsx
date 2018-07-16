import * as React from "react";
import { Link } from "react-router-dom";
import { css } from "glamor";

interface Props {
  username?: string;
}

const styles = {
  wrapper: css({
    display: "flex",
    justifyContent: "space-between",
    background: "wheat",
  }),
};

export default ({ username }: Props) => (
  <div {...styles.wrapper}>
    <div><Link to="/">Exam App</Link></div>
    <div>{username}</div>
  </div>
);
