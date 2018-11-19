import * as React from "react";
import {css} from "glamor";
import * as ReactMarkdown from "react-markdown";
import * as RemarkMathPlugin from "remark-math";
import MathJax from 'react-mathjax2';

interface Props {
  value: string;
  background?: string;
}

const styles = {
  wrapper: css({
    paddingTop: "2px",
    paddingBottom: "2px",
    paddingLeft: "20px",
    paddingRight: "20px"
  }),
};

export default ({value, background}: Props) => {
  if (value.length === 0) {
    return <div/>;
  }
  const renderers = {
    math: (props: {value: string}) =>
      <MathJax.Node>{props.value}</MathJax.Node>,
    inlineMath: (props: {value: string}) =>
      <MathJax.Node inline>{props.value}</MathJax.Node>,
  };
  return <div {...styles.wrapper} {...css({background: background || "#ffdfb4"})}>
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
