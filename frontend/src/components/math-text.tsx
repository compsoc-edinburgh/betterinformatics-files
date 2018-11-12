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

function replaceNewlines(text: string): string {
  // TODO find cleaner way to support newlines
  return text.replace("\r", "").replace(/\n\n/g, "\\(\\\\\\)");
}

export default ({value}: Props) => {
  return <div {...styles.wrapper}>
    <MathJax.Context input="tex">
      <MathJax.Text text={replaceNewlines(value)}/>
    </MathJax.Context>
  </div>;
};
