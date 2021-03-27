import { useRequest } from "@umijs/hooks";
import React from "react";
import { fetchGet } from "../api/fetch-utils";
import MarkdownText from "./markdown-text";
interface SummaryMarkdownProps {
  url: string;
}
const SummaryMarkdown: React.FC<SummaryMarkdownProps> = ({ url }) => {
  const { error: pdfError, loading: pdfLoading, data } = useRequest(() =>
    fetch(url).then(r => r.text()),
  );

  return <>{data && <MarkdownText value={data} />}</>;
};

export default SummaryMarkdown;
