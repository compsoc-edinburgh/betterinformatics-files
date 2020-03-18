import { useParams, Link } from "react-router-dom";
import React, { useMemo, useEffect, useState } from "react";
import {
  Container,
  Spinner,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
} from "@vseth/components";
import { fetchapi } from "../fetch-utils";
import {
  ExamMetaData,
  ServerCutPosition,
  Section,
  SectionKind,
} from "../interfaces";
import { useRequest, useSize } from "@umijs/hooks";
import { loadSections } from "../exam-loader";
import { createSectionRenderer, SectionRenderer } from "../split-render";
import { PDFDocumentProxy, PDFJS } from "../pdfjs";
import { getDocument } from "pdfjs-dist";
import { useUser } from "../auth";
import AnswerSectionComponent from "../components/answer-section";
import PdfSectionComp from "../components/pdf-section";
import useDpr from "../hooks/useDpr";

const loadExamMetaData = async (filename: string) => {
  return (await fetchapi(`/api/exam/${filename}/metadata`))
    .value as ExamMetaData;
};
const loadSplitRenderer = async (filename: string) => {
  const pdf = await new Promise<PDFDocumentProxy>((resolve, reject) =>
    getDocument(`/api/pdf/exam/${filename}`).promise.then(resolve, reject),
  );
  const renderer = await createSectionRenderer(pdf, 0);
  return [pdf, renderer] as const;
};

interface ServerCutResponse {
  [pageNumber: string]: ServerCutPosition[];
}
const loadCuts = async (filename: string) => {
  return (await fetchapi(`/api/exam/${filename}/cuts`))
    .value as ServerCutResponse;
};

interface ExamPageContentProps {
  metaData: ExamMetaData;
  sections?: Section[];
  renderer?: SectionRenderer;
  width: number;
}
const ExamPageContent: React.FC<ExamPageContentProps> = ({
  metaData,
  sections,
  renderer,
  width,
}) => {
  const { isAdmin } = useUser()!;
  const dpr = 2;
  console.log(dpr);
  return (
    <>
      <h1>{metaData.displayname}</h1>
      <div>
        {sections &&
          sections.map(section =>
            section.kind === SectionKind.Answer ? (
              <AnswerSectionComponent
                key={section.oid}
                isAdmin={isAdmin}
                isExpert={metaData.isExpert}
                filename={metaData.filename}
                oid={section.oid}
                width={width}
                canDelete={metaData.canEdit}
                onSectionChange={() => console.log("change")}
                onToggleHidden={() => console.log("toggle")}
                hidden={section.hidden}
                cutVersion={section.cutVersion}
              />
            ) : (
              renderer && (
                <PdfSectionComp
                  key={section.key}
                  section={section}
                  renderer={renderer}
                  width={width}
                  dpr={dpr}
                  renderText={false}
                  onClick={() => console.log("click")}
                />
              )
            ),
          )}
      </div>
    </>
  );
};

const ExamPage: React.FC<{}> = () => {
  const { filename } = useParams() as { filename: string };
  const {
    error: metaDataError,
    loading: metaDataLoading,
    data: metaData,
  } = useRequest(() => loadExamMetaData(filename));
  const {
    error: cutsError,
    loading: cutsLoading,
    data: cuts,
  } = useRequest(() => loadCuts(filename));
  const [size, sizeRef] = useSize<HTMLDivElement>();
  const { error: pdfError, loading: pdfLoading, data } = useRequest(() =>
    loadSplitRenderer(filename),
  );
  const [pdf, renderer] = data ? data : [];
  const sections = useMemo(
    () => (cuts && pdf ? loadSections(pdf.numPages, cuts) : undefined),
    [pdf, cuts],
  );
  useEffect(() => {
    if (size.width && renderer) renderer.setTargetWidth(size.width);
  }, [size.width, renderer]);

  const error = metaDataError || cutsError || pdfError;
  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Link to="">{metaData && metaData.category}</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{metaData && metaData.displayname}</BreadcrumbItem>
      </Breadcrumb>
      <div ref={sizeRef}>
        {error ? (
          <Alert color="danger">{error}</Alert>
        ) : metaDataLoading ? (
          <Spinner />
        ) : (
          metaData && (
            <ExamPageContent
              width={size.width || 0}
              metaData={metaData}
              sections={sections}
              renderer={renderer}
            />
          )
        )}
        {(cutsLoading || pdfLoading) && !metaDataLoading && <Spinner />}
      </div>
    </Container>
  );
};
export default ExamPage;
