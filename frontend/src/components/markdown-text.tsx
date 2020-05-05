import * as React from "react";
import { css } from "emotion";
import ReactMarkdown from "react-markdown";
import * as RemarkMathPlugin from "remark-math";
import "katex/dist/katex.min.css";
import TeX from "@matejmazur/react-katex";
import SyntaxHighlighter from "react-syntax-highlighter";
import { solarizedLight } from "react-syntax-highlighter/dist/styles/hljs";

interface Props {
  value: string;
}

const wrapperStyle = css`
  overflow-x: auto;
  overflow-y: hidden;
  & p:first-child {
    margin-block-start: 0;
  }
  & p:last-child {
    margin-block-end: 0;
  }
  & img {
    max-width: 100%;
  }
  @media (max-width: 699px) {
    & p {
      margin-block-start: 0.5em;
      margin-block-end: 0.5em;
    }
  }
`;

export default ({ value }: Props) => {
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
    <div className={wrapperStyle}>
      <ReactMarkdown
        source={value}
        transformImageUri={uri => {
          if (uri.includes("/")) {
            return uri;
          } else {
            return `/api/image/get/${uri}/`;
          }
        }}
        plugins={[RemarkMathPlugin]}
        // tslint:disable-next-line: no-any
        renderers={renderers as any}
      />
    </div>
  );
};
