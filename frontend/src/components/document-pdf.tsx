import { useLocalStorageState, useRequest, useSize } from "@umijs/hooks";
import { Container } from "@mantine/core";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import React, { useCallback, useMemo } from "react";
import { getHeaders } from "../api/fetch-utils";
import PDF from "../pdf/pdf-renderer";
import PdfSectionCanvas from "../pdf/pdf-section-canvas";
import { getDocument } from "../pdf/pdfjs";
import ContentContainer from "./secondary-container";
import useToggle from "../hooks/useToggle";
import PdfPanelBase from "./pdf-panel-base";
import useSet from "../hooks/useSet";

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

  const [maxWidth, setMaxWidth] = useLocalStorageState("max-width", 1000);
  const [panelIsOpen, togglePanel] = useToggle();

  // Set of pages that are currently in view
  const [inViewPages, addInViewPages, removeInViewPages] = useSet<number>();

  const inViewChange = useCallback(
    (pageNumber: number, v: boolean) =>
      v ? addInViewPages(pageNumber) : removeInViewPages(pageNumber),
    [addInViewPages, removeInViewPages],
  );

  // Dict of page number to its visibility update callback. We use a dict
  // instead of array to support the future possibility where getPages() might
  // not return a continuous range of page numbers.
  const inViewChangeListeners = useMemo(
    () =>
      Object.fromEntries(getPages(renderer).map(pageNumber =>
        [pageNumber, (v: boolean) => inViewChange(pageNumber, v)],
      )),
    [renderer],
  );

  return (
    <>
      <ContentContainer mt="-2px">
        <Container size="xl" style={{ maxWidth }}>
          {pdfError && "Error loading PDF"}

          <div ref={sizeRef}>
            {renderer && (
              <div>
                {getPages(renderer).map(pageNumber => (
                  <React.Fragment key={pageNumber}>
                    <div id={`page-${pageNumber}`} key={pageNumber} />
                    <PdfSectionCanvas
                      oid={undefined}
                      page={pageNumber}
                      start={0}
                      end={1}
                      targetWidth={size.width}
                      renderer={renderer}
                      onInViewChange={inViewChangeListeners[pageNumber]}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </Container>
      </ContentContainer>
      <PdfPanelBase
        isOpen={panelIsOpen}
        toggle={togglePanel}
        renderer={renderer}
        maxWidth={maxWidth}
        setMaxWidth={setMaxWidth}
        inViewPages={inViewPages}
        />
    </>
  );
};

export default DocumentPdf;
