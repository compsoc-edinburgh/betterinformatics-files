import { useRequest, useSize } from "@umijs/hooks";
import { Container } from "@mantine/core";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import React from "react";
import { getHeaders } from "../api/fetch-utils";
import PDF from "../pdf/pdf-renderer";
import PdfSectionCanvas from "../pdf/pdf-section-canvas";
import { getDocument } from "../pdf/pdfjs";
import ContentContainer from "./secondary-container";

const loadDocumentRenderer = async (url: string) => {
  const pdf = await new Promise<PDFDocumentProxy>((resolve, reject) =>
    getDocument({
      httpHeaders: getHeaders(),
      url,
    }).promise.then(resolve, reject),
  );
  const renderer = new PDF(pdf);
  return [pdf, renderer] as const;
};

const getPages = (pdf: PDF | undefined) => {
  if (pdf === undefined) return [];

  const result = [];
  for (let i = 1; i <= pdf.document.numPages; i++) result.push(i);
  return result;
};

interface DocumentPdfProps {
  url: string;
}
const DocumentPdf: React.FC<DocumentPdfProps> = ({ url }) => {
  const { error: pdfError, data } = useRequest(
    () => loadDocumentRenderer(url),
    {
      refreshDeps: [url],
    },
  );
  const [size, sizeRef] = useSize<HTMLDivElement>();
  const renderer = data ? data[1] : undefined;
  return (
    <ContentContainer mt="-2px">
      <Container size="xl">
        {pdfError && "Error loading PDF"}

        <div ref={sizeRef} className="mx-auto my-3">
          {renderer && (
            <div className="d-flex flex-column">
              {getPages(renderer).map(pageNumber => (
                <PdfSectionCanvas
                  key={pageNumber}
                  oid={undefined}
                  page={pageNumber}
                  start={0}
                  end={1}
                  targetWidth={size.width}
                  renderer={renderer}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </ContentContainer>
  );
};

export default DocumentPdf;
