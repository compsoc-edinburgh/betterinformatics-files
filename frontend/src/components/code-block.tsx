import * as React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/styles/hljs";

interface Props {
  value?: string;
  language: string;
}

export default ({ value, language }: Props) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={atomOneLight}
      customStyle={{
        padding: "0.8em",
        borderRadius: "0.2rem",
        border: "0.05rem solid rgba(0,0,0, 0.1)",
      }}
    >
      {value ?? ""}
    </SyntaxHighlighter>
  );
};
