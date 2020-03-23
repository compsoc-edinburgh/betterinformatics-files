import { useRequest, useSize } from "@umijs/hooks";
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Container,
  Spinner,
} from "@vseth/components";
import { getDocument } from "pdfjs-dist";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnswerSectionComponent from "../components/answer-section";
import PdfSectionCanvas from "../components/pdf-section-canvas";
import { loadSections } from "../exam-loader";
import { fetchapi } from "../fetch-utils";
import useSet from "../hooks/useSet";
import {
  ExamMetaData,
  Section,
  SectionKind,
  ServerCutPosition,
} from "../interfaces";
import PDF from "../pdf-renderer";
import { PDFDocumentProxy } from "../pdfjs";
import PrintExam from "../components/print-exam";
const CUT_VERSION_UPDATE_INTERVAL = 60_000;

const loadExamMetaData = async (filename: string) => {
  return (await fetchapi(`/api/exam/metadata/${filename}/`))
    .value as ExamMetaData;
};
const loadSplitRenderer = async (filename: string) => {
  const pdf = await new Promise<PDFDocumentProxy>((resolve, reject) =>
    getDocument(`/api/exam/pdf/exam/${filename}`).promise.then(resolve, reject),
  );
  const renderer = new PDF(pdf);
  return [pdf, renderer] as const;
};
interface CutVersions {
  [oid: string]: number;
}
const loadCutVersions = async (filename: string) => {
  return (await fetchapi(`/api/exam/cutversions/${filename}/`))
    .value as CutVersions;
};

interface ServerCutResponse {
  [pageNumber: string]: ServerCutPosition[];
}
const loadCuts = async (filename: string) => {
  return (await fetchapi(`/api/exam/cuts/${filename}/`))
    .value as ServerCutResponse;
};

interface ExamPageContentProps {
  metaData: ExamMetaData;
  sections?: Section[];
  renderer?: PDF;
  width: number;
  sizeRef: React.MutableRefObject<HTMLDivElement>;
}
const ExamPageContent: React.FC<ExamPageContentProps> = ({
  metaData,
  sections,
  renderer,
  width,
  sizeRef,
}) => {
  const { filename } = metaData;
  const [visible, show, hide] = useSet<string>();
  const [cutVersions, setCutVersions] = useState<CutVersions>({});
  const { run: updateCuts } = useRequest(() => loadCutVersions(filename), {
    manual: true,
    onSuccess: response => {
      setCutVersions(oldVersions => ({ ...oldVersions, ...response }));
    },
  });
  useEffect(() => {
    const interval = window.setInterval(
      updateCuts,
      CUT_VERSION_UPDATE_INTERVAL,
    );
    return () => {
      window.clearInterval(interval);
    };
  });
  return (
    <>
      <Container>
        <h1>{metaData.displayname}</h1>
      </Container>
      {metaData.is_printonly && (
        <PrintExam title="exam" examtype="exam" filename={metaData.filename} />
      )}
      {metaData.has_solution && metaData.solution_printonly && (
        <PrintExam
          title="solution"
          examtype="solution"
          filename={metaData.filename}
        />
      )}

      <div ref={sizeRef} style={{ maxWidth: "1000px", margin: "auto" }}>
        {sections &&
          sections.map(section =>
            section.kind === SectionKind.Answer ? (
              <AnswerSectionComponent
                key={section.oid}
                isExpert={metaData.isExpert}
                filename={metaData.filename}
                oid={section.oid}
                width={width}
                canDelete={metaData.canEdit}
                onSectionChange={() => console.log("change")}
                onToggleHidden={() =>
                  visible.has(section.oid)
                    ? hide(section.oid)
                    : show(section.oid)
                }
                hidden={!visible.has(section.oid)}
                cutVersion={cutVersions[section.oid] || section.cutVersion}
                setCutVersion={newVersion =>
                  setCutVersions(oldVersions => ({
                    ...oldVersions,
                    [section.oid]: newVersion,
                  }))
                }
              />
            ) : (
              renderer && (
                <PdfSectionCanvas
                  key={section.key}
                  section={section}
                  renderer={renderer}
                  targetWidth={width}
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
  } = useRequest(() => loadExamMetaData(filename), {
    cacheKey: `exam-metaData-${filename}`,
  });
  const { error: cutsError, loading: cutsLoading, data: cuts } = useRequest(
    () => loadCuts(filename),
    {
      cacheKey: `exam-cuts-${filename}`,
    },
  );
  const [size, sizeRef] = useSize<HTMLDivElement>();
  const { error: pdfError, loading: pdfLoading, data } = useRequest(() =>
    loadSplitRenderer(filename),
  );
  const [pdf, renderer] = data ? data : [];
  const sections = useMemo(
    () => (cuts && pdf ? loadSections(pdf.numPages, cuts) : undefined),
    [pdf, cuts],
  );

  const error = metaDataError || cutsError || pdfError;
  return (
    <div>
      <Container>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={`/category/${metaData ? metaData.category : ""}`}>
              {metaData && metaData.category_displayname}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>{metaData && metaData.displayname}</BreadcrumbItem>
        </Breadcrumb>
      </Container>
      <div>
        {error && (
          <Container>
            <Alert color="danger">{error.toString()}</Alert>
          </Container>
        )}
        {metaDataLoading && (
          <Container>
            <Spinner />
          </Container>
        )}
        {metaData && (
          <ExamPageContent
            width={size.width || 0}
            metaData={metaData}
            sections={sections}
            renderer={renderer}
            sizeRef={sizeRef}
          />
        )}
        {(cutsLoading || pdfLoading) && !metaDataLoading && (
          <Container>
            <Spinner />
          </Container>
        )}
      </div>
    </div>
  );
};
export default ExamPage;
