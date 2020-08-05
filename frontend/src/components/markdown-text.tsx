import TeX from "@matejmazur/react-katex";
import { css } from "emotion";
import "katex/dist/katex.min.css";
import * as React from "react";
import ReactMarkdown, { ReactMarkdownProps } from "react-markdown";
import * as RemarkMathPlugin from "remark-math";
import CodeBlock from "./code-block";

interface Props {
  value: string;
  regex?: RegExp;
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

export default ({ value, regex }: Props) => {
  if (value.length === 0) {
    return <div />;
  }
  const renderers: ReactMarkdownProps["renderers"] = {
    text: ({ value }: { value: string }) => {
      if (regex === undefined) return <span>{value}</span>;
      const arr: React.ReactChild[] = [];
      const m = regex.test(value);
      if (!m) return <span>{value}</span>;
      let i = 0;
      while (i < value.length) {
        const rest = value.substring(i);
        const m = rest.match(regex);
        if (m) {
          const start = m.index || 0;
          arr.push(<span key={start}>{rest.substring(0, start)}</span>);
          arr.push(<mark key={`${start}match`}>{m[0]}</mark>);

          i += start + m[0].length;
        } else {
          arr.push(<span key="rest">{rest}</span>);
          break;
        }
      }
      return <>{arr}</>;
    },
    math: (props: { value: string }) => <TeX math={props.value} block />,
    inlineMath: (props: { value: string }) => <TeX math={props.value} />,
    code: (props: { value: string; language: string }) => (
      <CodeBlock language={props.language} value={props.value} />
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
        renderers={renderers}
      />
    </div>
  );
};
