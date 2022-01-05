import * as React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import atomOneLight from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light";

interface Props {
  value?: string;
  language?: string;
}

const CodeBlock = ({ value, language }: Props) => {
  return (
    <SyntaxHighlighter
      // Defaulting to "text" here prevents hljs from applying heuristics to determine the language
      // of the code block. Often times this behavior is confusing, thus we skip highlighting for these
      // cases. Users can annotate their code blocks with the respective language if they wish their code
      // to be highlighted.
      language={language ?? "text"}
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
