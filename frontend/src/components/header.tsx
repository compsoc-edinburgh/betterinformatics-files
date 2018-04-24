import * as React from "react";
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
    <div>Exam App</div>
    <div>{username}</div>
  </div>
);
