import * as React from "react";
import {css} from "glamor";
import * as ReactMarkdown from "react-markdown";
import * as RemarkMathPlugin from "remark-math";
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

export default ({value}: Props) => {
  if (value.length === 0) {
    return <div/>;
  }
  const renderers = {
    math: (props: {value: string}) =>
      <MathJax.Node>{props.value}</MathJax.Node>,
    inlineMath: (props: {value: string}) =>
      <MathJax.Node inline>{props.value}</MathJax.Node>,
  };
  return <div {...styles.wrapper}>
    <MathJax.Context input="tex">
      <ReactMarkdown
        source={value}
        plugins={[RemarkMathPlugin]}
        // tslint:disable-next-line: no-any
        renderers={renderers as any}
      />
    </MathJax.Context>
  </div>;
};
