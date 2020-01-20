import * as React from "react";
import { css } from "glamor";
import * as ReactMarkdown from "react-markdown";
import * as RemarkMathPlugin from "remark-math";
import "katex/dist/katex.min.css";
import TeX from "@matejmazur/react-katex";
import Colors from "../colors";
import SyntaxHighlighter from "react-syntax-highlighter";
import { solarizedLight } from "react-syntax-highlighter/dist/styles/hljs";
// import MathJax from 'react-mathjax2';

interface Props {
  value: string;
  background?: string;
}

const styles = {
  wrapper: css({
    "& p:first-child": {
      marginBlockStart: "0",
    },
    "& p:last-child": {
      marginBlockEnd: "0",
    },
    "& img": {
      maxWidth: "100%",
    },
    "@media (max-width: 699px)": {
      "& p": {
        marginBlockStart: "0.5em",
        marginBlockEnd: "0.5em",
      },
    },
  }),
};

export default ({ value, background }: Props) => {
  if (value.length === 0) {
    return <div />;
  }
  const renderers = {
    math: (props: { value: string }) => <TeX math={props.value} block />,
    inlineMath: (props: { value: string }) => <TeX math={props.value} />,
    code: (props: { value: string; language: string }) => (
      <SyntaxHighlighter language={props.language} style={solarizedLight}>
        {props.value || " "}
      </SyntaxHighlighter>
    ),
  };
  return (
    <div
      {...styles.wrapper}
      {...css({ background: background || Colors.markdownBackground })}
      {...css({ overflow: "auto" })}
    >
      <ReactMarkdown
        source={value}
        transformImageUri={uri => {
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
    </div>
  );
};
