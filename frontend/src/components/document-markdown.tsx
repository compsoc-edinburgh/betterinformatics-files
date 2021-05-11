import { useRequest } from "@umijs/hooks";
import { Container } from "@vseth/components";
import React from "react";
import MarkdownText from "./markdown-text";

interface DocumentMarkdownProps {
  url: string;
}
const DocumentMarkdown: React.FC<DocumentMarkdownProps> = ({ url }) => {
  const { error: mdError, data } = useRequest(
    () => fetch(url).then((r) => r.text()),
    {
      refreshDeps: [url],
    },
  );

  return (
    <Container className="py-5">
      {mdError && "Error loading PDF"}
      {data !== undefined &&
        (data.length > 0 ? (
          <MarkdownText value={data} />
        ) : (
          "This document currently doesn't have any content."
        ))}
    </Container>
  );
};

export default DocumentMarkdown;
