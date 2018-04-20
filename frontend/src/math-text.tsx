import * as React from "react";
import { css } from "glamor";

interface Props {
  value: string;
}

const styles = {
  wrapper: css({
    border: "1px solid black",
    background: "wheat",
  }),
};

export default ({ value }: Props) => {
  return <div {...styles.wrapper}>{value}</div>;
};
