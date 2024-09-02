import { useComputedColorScheme } from "@mantine/core";
import { LightAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import atomOneLight from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light";

const aliases: Record<string, string | undefined> = {
  js: "javascript",
  JavaScript: "javascript",
  ts: "typescript",
  TypeScript: "typescript",
  "C++": "cpp",
  Cpp: "cpp",
  C: "c",
  Go: "go",
  Golang: "go",
  "C#": "csharp",
  Java: "java",
  md: "markdown",
  Markdown: "markdown",
  Ocaml: "ocaml",
  OCaml: "ocaml",
  Python: "python",
  Haskell: "haskell",
  bf: "brainfuck",
  py: "python",
  rs: "rust",
  ml: "ocaml",
  hs: "haskell",
  m: "objectivec",
  hpp: "cpp",
  h: "cpp",
  proto: "protobuf",
};

interface Props {
  value?: string;
  language?: string;
}

const CodeBlock = ({ value, language }: Props) => {
  const computedColorScheme = useComputedColorScheme();
  return (
    <SyntaxHighlighter
      // Defaulting to "text" here prevents hljs from applying heuristics to determine the language
      // of the code block. Often times this behavior is confusing, thus we skip highlighting for these
      // cases. Users can annotate their code blocks with the respective language if they wish their code
      // to be highlighted.
      language={language ? aliases[language] ?? language : "text"}
      style={computedColorScheme === "light" ? atomOneLight : atomOneDark}
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
