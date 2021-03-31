import { useRequest } from "@umijs/hooks";
import { Container } from "@vseth/components";
import React from "react";
import MarkdownText from "./markdown-text";

interface SummaryMarkdownProps {
  url: string;
}
const SummaryMarkdown: React.FC<SummaryMarkdownProps> = ({ url }) => {
  const { error: mdError, loading: mdLoading, data } = useRequest(() =>
    fetch(url).then(r => r.text()),
  );

  return (
    <Container className="py-5">
      {data !== undefined &&
        (data.length > 0 ? (
          <MarkdownText value={data} />
        ) : (
          "This summary currently doesn't have any content."
        ))}
    </Container>
  );
};

export default SummaryMarkdown;
