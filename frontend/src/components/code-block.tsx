import * as React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import atomOneLight from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";

interface Props {
  value?: string;
  language: string;
}

const CodeBlock = ({ value, language }: Props) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={atomOneLight}
      customStyle={{
        padding: "0.8em",
        borderRadius: "0.2rem",
        border: "0.05rem solid rgba(0,0,0, 0.1)",
        wordWrap: "normal",
        overflowX: "auto",
      }}
    >
      {value ?? ""}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
