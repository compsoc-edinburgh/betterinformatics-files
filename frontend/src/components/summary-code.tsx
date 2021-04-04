import { useRequest } from "@umijs/hooks";
import { Container } from "@vseth/components";
import React from "react";
import CodeBlock from "./code-block";

interface SummaryCodeProps {
  url: string;
}
const SummaryCode: React.FC<SummaryCodeProps> = ({ url }) => {
  const { data } = useRequest(() => fetch(url).then(r => r.text()));

  return (
    <Container className="py-5">
      {data !== undefined &&
        (data.length > 0 ? (
          <CodeBlock value={data} language="tex" />
        ) : (
          "This summary currently doesn't have any content."
        ))}
    </Container>
  );
};

export default SummaryCode;
