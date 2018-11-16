import * as React from "react";
import {css} from "glamor";
import MathJax from 'react-mathjax2';

interface Props {
  value: string;
}

const styles = {
  wrapper: css({
    background: "#ffdfb4",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "20px",
    paddingRight: "20px"
  }),
};

function replaceNewlines(text: string): string {
  // TODO find cleaner way to support newlines
  return text.replace("\r", "").replace(/\n\n/g, "\\(\\\\\\)");
}

export default ({value}: Props) => {
  if (value.length === 0) {
    return <div/>;
  }
  return <div {...styles.wrapper}>
    <MathJax.Context input="tex">
      <MathJax.Text text={replaceNewlines(value)}/>
    </MathJax.Context>
  </div>;
};
