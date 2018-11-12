import * as React from "react";
import {css} from "glamor";
import MathJax from 'react-mathjax2';

interface Props {
  value: string;
}

const styles = {
  wrapper: css({
    border: "1px solid black",
    background: "wheat",
    minHeight: "20px"
  }),
};

// TODO Actually allow inline formulas

export default ({value}: Props) => {
  return <div {...styles.wrapper}>
    <MathJax.Context input="tex">
      <MathJax.Text text={value}/>
    </MathJax.Context>
  </div>;
};
