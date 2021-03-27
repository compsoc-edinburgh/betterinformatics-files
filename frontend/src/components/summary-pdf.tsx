import { useRequest, useSize } from "@umijs/hooks";
import { Container } from "@vseth/components";
import { PDFDocumentProxy } from "pdfjs-dist/types/display/api";
import React from "react";
import { getHeaders } from "../api/fetch-utils";
import PDF from "../pdf/pdf-renderer";
import PdfSectionCanvas from "../pdf/pdf-section-canvas";
import { getDocument } from "../pdf/pdfjs";
import ContentContainer from "./secondary-container";

const loadSummaryRenderer = async (url: string) => {
  const pdf = await new Promise<PDFDocumentProxy>((resolve, reject) =>
    getDocument({
      httpHeaders: getHeaders(),
      url,
    }).promise.then(resolve, reject),
  );
  const renderer = new PDF(pdf);
  return [pdf, renderer] as const;
};
interface SummaryPdfProps {
  url: string;
}
const SummaryPdf: React.FC<SummaryPdfProps> = ({ url }) => {
  const { error: pdfError, loading: pdfLoading, data } = useRequest(() =>
    loadSummaryRenderer(url),
  );
  const [size, sizeRef] = useSize<HTMLDivElement>();
  const [pdf, renderer] = data ? data : [];
  console.log(size.width);
  return (
    <ContentContainer>
      <Container>
        {pdfError && "Error loading PDF"}

        <div ref={sizeRef} className="mx-auto my-3">
          {renderer && (
            <div className="d-flex flex-column">
              <PdfSectionCanvas
                oid={undefined}
                page={1}
                start={0}
                end={1}
                targetWidth={size.width}
                renderer={renderer}
              />
            </div>
          )}
        </div>
      </Container>
    </ContentContainer>
  );
};

export default SummaryPdf;
