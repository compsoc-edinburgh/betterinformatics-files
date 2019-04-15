import * as React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { solarizedLight } from 'react-syntax-highlighter/dist/styles/hljs';

interface Props {
  value: string;
  language: string;
}

export default ({value, language}: Props) => {
  return (
    <SyntaxHighlighter language={language} style={solarizedLight}>
      {value}
    </SyntaxHighlighter>
  );
};
