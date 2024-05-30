import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// Import mchem plugin to register macros for chemical equations in katex.
// The plugin registers macros when it is imported. We do this after we import "rehype-katex"
// which transitively imports katex such that the global variables which katex uses are set up.
import "katex/contrib/mhchem/mhchem";
import "katex/dist/katex.min.css";
import * as React from "react";
import { useMemo } from "react";
import CodeBlock from "./code-block";
import { Alert, Table } from "@mantine/core";
import ErrorBoundary from "./error-boundary";
import clsx from "clsx";
import classes from "./markdown-text.module.css";

const transformImageUri = (uri: string) => {
  if (uri.includes("/")) {
    return uri;
  } else {
    return `/api/image/get/${uri}/`;
  }
};

const createComponents = (regex: RegExp | undefined): Components => ({
  table: ({ children }) => {
    return <Table style={{ width: "auto" }} withColumnBorders={true}>{children}</Table>;
  },
  tbody: ({ children }) => {
    return <Table.Tbody>{children}</Table.Tbody>;
  },
  thead: ({ children }) => {
    return <Table.Thead>{children}</Table.Thead>;
  },
  td: ({ children }) => {
    return <Table.Td>{children}</Table.Td>;
  },
  th: ({ children }) => {
    return <Table.Th>{children}</Table.Th>;
  },
  tr: ({ children }) => {
    return <Table.Tr>{children}</Table.Tr>;
  },
  p: ({ children }) => {
    if (regex === undefined) return <p>{children}</p>;
    const arr = [];
    const value = String(children);
    const m = regex.test(value);
    if (!m) return <p>{children}</p>;
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
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <CodeBlock
        language={match ? match[1] : undefined}
        value={String(children).replace(/\n$/, "")}
        {...props}
      />
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
});

interface Props {
  /**
   * The markdown string that should be rendered.
   */
  value: string;
  /**
   * A regex which should be used for highlighting. If undefined no text will
   * be highlighted.
   */
  regex?: RegExp;
}

// Example that triggers the error: $\begin{\pmatrix}$
const errorMessage = (
  <Alert color="red" title="Rendering error">
    An error ocurred when rendering this content. This is likely caused by
    invalid LaTeX syntax.
  </Alert>
);

const MarkdownText: React.FC<Props> = ({ value, regex }) => {
  const macros = {}; // Predefined macros. Will be edited by KaTex while rendering!
  const renderers = useMemo(() => createComponents(regex), [regex]);
  if (value.length === 0) {
    return <div />;
  }
  return (
    <div className={clsx(classes.wrapperStyle, classes.blockquoteStyle)}>
      <ErrorBoundary fallback={errorMessage}>
        <ReactMarkdown
          children={value}
          urlTransform={transformImageUri}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[[rehypeKatex, { macros }]]}
          components={renderers}
        />
      </ErrorBoundary>
    </div>
  );
};

export default MarkdownText;
