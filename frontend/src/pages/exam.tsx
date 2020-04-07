import { useLocalStorageState, useRequest, useSize } from "@umijs/hooks";
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Container,
  Spinner,
} from "@vseth/components";
import React, { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadSections } from "../api/exam-loader";
import { fetchPost } from "../api/fetch-utils";
import { loadCuts, loadExamMetaData, loadSplitRenderer } from "../api/hooks";
import { useUser, UserContext } from "../auth";
import Exam from "../components/exam";
import ExamMetadataEditor from "../components/exam-metadata-editor";
import ExamPanel from "../components/exam-panel";
import IconButton from "../components/icon-button";
import PrintExam from "../components/print-exam";
import useSet from "../hooks/useSet";
import useToggle from "../hooks/useToggle";
import {
  EditMode,
  ExamMetaData,
  PdfSection,
  Section,
  EditState,
} from "../interfaces";
import PDF from "../pdf/pdf-renderer";

const addCut = async (filename: string, pageNum: number, relHeight: number) => {
  await fetchPost(`/api/exam/addcut/${filename}/`, {
    pageNum,
    relHeight,
    name: "",
  });
};
const moveCut = async (
  filename: string,
  cut: string,
  pageNum: number,
  relHeight: number,
) => {
  await fetchPost(`/api/exam/editcut/${cut}/`, { pageNum, relHeight });
};
const updateCutName = async (cut: string, name: string) => {
  await fetchPost(`/api/exam/editcut/${cut}/`, { name });
};

interface ExamPageContentProps {
  metaData: ExamMetaData;
  sections?: Section[];
  renderer?: PDF;
  reloadCuts: () => void;
  toggleEditing: () => void;
}
const ExamPageContent: React.FC<ExamPageContentProps> = ({
  metaData,
  sections,
  renderer,
  reloadCuts,
  toggleEditing,
}) => {
  const user = useUser()!;
  const { run: runAddCut } = useRequest(addCut, {
    manual: true,
    onSuccess: reloadCuts,
  });
  const { run: runMoveCut } = useRequest(moveCut, {
    manual: true,
    onSuccess: () => {
      reloadCuts();
      setEditState({ mode: EditMode.None });
    },
  });
  const { run: runUpdateCutName } = useRequest(updateCutName, {
    manual: true,
    onSuccess: () => {
      reloadCuts();
    },
  });

  const [size, sizeRef] = useSize<HTMLDivElement>();
  const [maxWidth, setMaxWidth] = useLocalStorageState("max-width", 1000);

  const [visibleSplits, addVisible, removeVisible] = useSet<PdfSection>();
  const [panelIsOpen, togglePanel] = useToggle();
  const [editState, setEditState] = useState<EditState>({
    mode: EditMode.None,
  });

  const visibleChangeListener = useCallback(
    (section: PdfSection, v: boolean) =>
      v ? addVisible(section) : removeVisible(section),
    [addVisible, removeVisible],
  );
  const visiblePages = useMemo(() => {
    const s = new Set<number>();
    for (const split of visibleSplits) {
      s.add(split.start.page);
    }
    return s;
  }, [visibleSplits]);

  const width = size.width;
  return (
    <>
      <Container>
        {user.isCategoryAdmin && (
          <IconButton close icon="EDIT" onClick={() => toggleEditing()} />
        )}
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
      <ExamPanel
        isOpen={panelIsOpen}
        toggle={togglePanel}
        metaData={metaData}
        renderer={renderer}
        visiblePages={visiblePages}
        maxWidth={maxWidth}
        setMaxWidth={setMaxWidth}
        editState={editState}
        setEditState={setEditState}
      />
      <div ref={sizeRef} style={{ maxWidth, margin: "auto" }}>
        {width && sections && renderer && (
          <Exam
            metaData={metaData}
            sections={sections}
            width={width}
            editState={editState}
            setEditState={setEditState}
            reloadCuts={reloadCuts}
            renderer={renderer}
            onCutNameChange={runUpdateCutName}
            onAddCut={runAddCut}
            onMoveCut={runMoveCut}
            visibleChangeListener={visibleChangeListener}
          />
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
    mutate: setMetaData,
  } = useRequest(() => loadExamMetaData(filename), {
    cacheKey: `exam-metaData-${filename}`,
  });
  const {
    error: cutsError,
    loading: cutsLoading,
    data: cuts,
    run: reloadCuts,
  } = useRequest(() => loadCuts(filename), {
    cacheKey: `exam-cuts-${filename}`,
  });
  const { error: pdfError, loading: pdfLoading, data } = useRequest(() =>
    loadSplitRenderer(filename),
  );
  const [pdf, renderer] = data ? data : [];
  const sections = useMemo(
    () => (cuts && pdf ? loadSections(pdf.numPages, cuts) : undefined),
    [pdf, cuts],
  );
  const [editing, toggleEditing] = useToggle();
  const error = metaDataError || cutsError || pdfError;
  const user = useUser()!;
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
          <Container className="position-absolute">
            <Spinner />
          </Container>
        )}
        {metaData &&
          (editing ? (
            <Container>
              <ExamMetadataEditor
                currentMetaData={metaData}
                toggle={toggleEditing}
                onMetaDataChange={setMetaData}
              />
            </Container>
          ) : (
            <UserContext.Provider
              value={{
                ...user,
                isExpert: user.isExpert || metaData.isExpert,
              }}
            >
              <ExamPageContent
                metaData={metaData}
                sections={sections}
                renderer={renderer}
                reloadCuts={reloadCuts}
                toggleEditing={toggleEditing}
              />
            </UserContext.Provider>
          ))}
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
