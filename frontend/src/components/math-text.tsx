import * as React from "react";
import {css} from "glamor";
import MathJax from 'react-mathjax2';

interface Props {
  value: string;
}

const styles = {
  wrapper: css({
    background: "#ffdfb4",
    minHeight: "24px",
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
  return <div {...styles.wrapper}>
    {value.length > 0 &&
      <MathJax.Context input="tex">
        <MathJax.Text text={replaceNewlines(value)}/>
      </MathJax.Context>
    }
  </div>;
};
