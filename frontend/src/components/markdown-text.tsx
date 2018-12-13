import * as React from "react";
import {css} from "glamor";
import * as ReactMarkdown from "react-markdown";
import * as RemarkMathPlugin from "remark-math";
import 'katex/dist/katex.min.css';
import TeX from '@matejmazur/react-katex'
// import MathJax from 'react-mathjax2';

interface Props {
  value: string;
  background?: string;
}

const styles = {
  wrapper: css({
    paddingTop: "2px",
    paddingBottom: "2px",
    paddingLeft: "20px",
    paddingRight: "20px",
    "& img": css({
      maxWidth: "100%",
    }),
  }),
};

export default ({value, background}: Props) => {
  if (value.length === 0) {
    return <div/>;
  }
  const renderers = {
    math: (props: {value: string}) =>
      <TeX math={props.value} block/>,
    inlineMath: (props: {value: string}) =>
      <TeX math={props.value}/>,
  };
  return <div {...styles.wrapper} {...css({background: background || "#ffdfb4"})}>
    <ReactMarkdown
      source={value}
      transformImageUri={(uri) => {
        if (uri.includes("/")) {
          return uri;
        } else {
          return "/api/img/" + uri;
        }
      }}
      plugins={[RemarkMathPlugin]}
      // tslint:disable-next-line: no-any
      renderers={renderers as any}
    />
  </div>;
};
