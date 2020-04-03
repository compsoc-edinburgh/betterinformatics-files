import { useRequest, useSize, useLocalStorageState } from "@umijs/hooks";
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Container,
  Spinner,
} from "@vseth/components";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnswerSectionComponent from "../components/answer-section";
import ExamPanel from "../components/exam-panel";
import PdfSectionCanvas from "../pdf/pdf-section-canvas";
import PrintExam from "../components/print-exam";
import { loadSections } from "../api/exam-loader";
import {
  loadCuts,
  loadCutVersions,
  loadExamMetaData,
  loadSplitRenderer,
} from "../api/hooks";
import useSet from "../hooks/useSet";
import useToggle from "../hooks/useToggle";
import {
  CutVersions,
  ExamMetaData,
  PdfSection,
  Section,
  SectionKind,
  EditMode,
  EditState,
} from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import { fetchpost } from "../api/fetch-utils";
import ExamMetadataEditor from "../components/exam-metadata-editor";
const CUT_VERSION_UPDATE_INTERVAL = 60_000;

const addCut = async (filename: string, pageNum: number, relHeight: number) => {
  await fetchpost(`/api/exam/addcut/${filename}/`, {
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
  await fetchpost(`/api/exam/editcut/${cut}/`, { pageNum, relHeight });
};
const updateCutName = async (cut: string, name: string) => {
  await fetchpost(`/api/exam/editcut/${cut}/`, { name });
};

interface ExamPageContentProps {
  metaData: ExamMetaData;
  sections?: Section[];
  renderer?: PDF;
  reloadCuts: () => void;
}
const ExamPageContent: React.FC<ExamPageContentProps> = ({
  metaData,
  sections,
  renderer,
  reloadCuts,
}) => {
  const { filename } = metaData;

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
  const { run: updateCuts } = useRequest(() => loadCutVersions(filename), {
    manual: true,
    onSuccess: response => {
      setCutVersions(oldVersions => ({ ...oldVersions, ...response }));
    },
  });
  const [size, sizeRef] = useSize<HTMLDivElement>();
  const [maxWidth, setMaxWidth] = useLocalStorageState("max-width", 1000);
  const [visible, show, hide] = useSet<string>();
  const [cutVersions, setCutVersions] = useState<CutVersions>({});
  const [visibleSplits, addVisible, removeVisible] = useSet<PdfSection>();
  const [panelIsOpen, togglePanel] = useToggle();
  const [editState, setEditState] = useLocalStorageState<EditState>(
    "edit-state",
    { mode: EditMode.None },
  );
  const snap =
    editState.mode === EditMode.Add || editState.mode === EditMode.Move
      ? editState.snap
      : true;
  useEffect(() => {
    const interval = window.setInterval(
      updateCuts,
      CUT_VERSION_UPDATE_INTERVAL,
    );
    return () => {
      window.clearInterval(interval);
    };
  });

  const visibleChangeListeners = useMemo(
    () =>
      sections?.map(section =>
        section.kind === SectionKind.Pdf
          ? (v: boolean) => (v ? addVisible(section) : removeVisible(section))
          : undefined,
      ),
    [sections, addVisible, removeVisible],
  );
  const visiblePages = useMemo(() => {
    const s = new Set<number>();
    for (const split of visibleSplits) {
      s.add(split.start.page);
    }
    return s;
  }, [visibleSplits]);

  let pageCounter = 0;
  const width = size.width;
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
        {width &&
          visibleChangeListeners &&
          sections &&
          sections.map((section, index) =>
            section.kind === SectionKind.Answer ? (
              <AnswerSectionComponent
                key={section.oid}
                isExpert={metaData.isExpert}
                filename={metaData.filename}
                oid={section.oid}
                width={width}
                canDelete={metaData.canEdit}
                onSectionChange={reloadCuts}
                onToggleHidden={() =>
                  visible.has(section.oid)
                    ? hide(section.oid)
                    : show(section.oid)
                }
                cutName={section.name}
                onCutNameChange={(newName: string) =>
                  runUpdateCutName(section.oid, newName)
                }
                hidden={!visible.has(section.oid)}
                cutVersion={cutVersions[section.oid] || section.cutVersion}
                setCutVersion={newVersion =>
                  setCutVersions(oldVersions => ({
                    ...oldVersions,
                    [section.oid]: newVersion,
                  }))
                }
                onCancelMove={() => setEditState({ mode: EditMode.None })}
                onMove={() =>
                  setEditState({ mode: EditMode.Move, cut: section.oid, snap })
                }
                isBeingMoved={
                  editState.mode === EditMode.Move &&
                  editState.cut === section.oid
                }
              />
            ) : (
              <React.Fragment key={section.key}>
                {pageCounter < section.start.page && ++pageCounter && (
                  <div id={`page-${pageCounter}`} />
                )}
                {renderer && (
                  <PdfSectionCanvas
                    section={section}
                    renderer={renderer}
                    targetWidth={width}
                    onVisibleChange={visibleChangeListeners[index]}
                    addCutText={
                      editState.mode === EditMode.Add
                        ? "Add Cut"
                        : editState.mode === EditMode.Move
                        ? "Move Cut"
                        : undefined
                    }
                    snap={snap}
                    onAddCut={(height: number) =>
                      editState.mode === EditMode.Add
                        ? runAddCut(
                            metaData.filename,
                            section.start.page,
                            height,
                          )
                        : editState.mode === EditMode.Move
                        ? runMoveCut(
                            metaData.filename,
                            editState.cut,
                            section.start.page,
                            height,
                          )
                        : undefined
                    }
                  />
                )}
              </React.Fragment>
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
  const [editing, toggleEditing] = useToggle(true);

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
          <Container style={{ position: "absolute" }}>
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
            <ExamPageContent
              metaData={metaData}
              sections={sections}
              renderer={renderer}
              reloadCuts={reloadCuts}
            />
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
