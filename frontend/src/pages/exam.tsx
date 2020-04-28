import { useLocalStorageState, useRequest, useSize } from "@umijs/hooks";
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Spinner,
} from "@vseth/components";
import React, { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadSections } from "../api/exam-loader";
import { fetchPost } from "../api/fetch-utils";
import { loadCuts, loadExamMetaData, loadSplitRenderer } from "../api/hooks";
import { UserContext, useUser } from "../auth";
import Exam from "../components/exam";
import ExamMetadataEditor from "../components/exam-metadata-editor";
import ExamPanel from "../components/exam-panel";
import IconButton from "../components/icon-button";
import PrintExam from "../components/print-exam";
import useSet from "../hooks/useSet";
import useToggle from "../hooks/useToggle";
import {
  EditMode,
  EditState,
  ExamMetaData,
  PdfSection,
  Section,
  ServerCutResponse,
  SectionKind,
} from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import ContentContainer from "../components/secondary-container";
import useTitle from "../hooks/useTitle";
import { TOCNode, TOC } from "../components/table-of-contents";

const addCut = async (
  filename: string,
  pageNum: number,
  relHeight: number,
  hidden = false,
) => {
  await fetchPost(`/api/exam/addcut/${filename}/`, {
    pageNum,
    relHeight,
    name: "",
    hidden,
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
const updateCutHidden = async (cut: string, hidden: boolean) => {
  console.log("updateCutHidden", cut, hidden);
  await fetchPost(`/api/exam/editcut/${cut}/`, { hidden });
};

interface ExamPageContentProps {
  metaData: ExamMetaData;
  sections?: Section[];
  renderer?: PDF;
  reloadCuts: () => void;
  mutateCuts: (mutation: (old: ServerCutResponse) => ServerCutResponse) => void;
  toggleEditing: () => void;
}
const ExamPageContent: React.FC<ExamPageContentProps> = ({
  metaData,
  sections,
  renderer,
  reloadCuts,
  mutateCuts,
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
    onSuccess: (_data, [oid, newName]) => {
      mutateCuts(oldCuts =>
        Object.keys(oldCuts).reduce(function(result, key) {
          result[key] = oldCuts[key].map(cutPosition =>
            cutPosition.oid === oid
              ? { ...cutPosition, name: newName }
              : cutPosition,
          );
          return result;
        }, {} as ServerCutResponse),
      );
    },
  });
  const { run: runUpateCutHidden } = useRequest(updateCutHidden, {
    manual: true,
    onSuccess: (_data, [oid, newHidden]) => {
      mutateCuts(oldCuts =>
        Object.keys(oldCuts).reduce(function(result, key) {
          result[key] = oldCuts[key].map(cutPosition =>
            cutPosition.oid === oid
              ? { ...cutPosition, hidden: newHidden }
              : cutPosition,
          );
          return result;
        }, {} as ServerCutResponse),
      );
    },
  });
  const onSectionHiddenChange = useCallback(
    (section: string | [number, number], newState: boolean) => {
      if (Array.isArray(section)) {
        runAddCut(metaData.filename, section[0], section[1], newState);
      } else {
        runUpateCutHidden(section, newState);
      }
    },
    [runAddCut, metaData, runUpateCutHidden],
  );

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
  const wikitransform = metaData.legacy_solution
    ? metaData.legacy_solution.split("/").pop()
    : "";
  const [displayOptions, setDisplayOptions] = useState({
    displayHiddenPdfSections: false,
    displayHiddenAnswerSections: false,
    displayHideShowButtons: false,
  });

  const toc = useMemo(() => {
    if (sections === undefined) {
      return undefined;
    }
    const rootNode = new TOCNode("[root]", "");
    for (const section of sections) {
      if (section.kind === SectionKind.Answer) {
        if (section.cutHidden) continue;
        const parts = section.name.split(" > ");
        if (parts.length === 1 && parts[0].length === 0) continue;
        const jumpTarget = `${section.oid}-${parts.join("-")}`;
        rootNode.add(parts, jumpTarget);
      }
    }
    if (rootNode.children.length === 0) return undefined;
    return rootNode;
  }, [sections]);

  return (
    <>
      <Container>
        {user.isCategoryAdmin && (
          <IconButton
            tooltip="Edit exam metadata"
            close
            icon="EDIT"
            onClick={() => toggleEditing()}
          />
        )}
        <h1>{metaData.displayname}</h1>
        <Row form>
          {!metaData.canView && (
            <Col md={6} lg={4}>
              <Card className="m-1">
                <CardBody>
                  {metaData.needs_payment && !metaData.hasPayed ? (
                    <>
                      You have to pay a deposit of 20 CHF in the VIS bureau in
                      order to see oral exams. After submitting a report of your
                      own oral exam you can get your deposit back.
                    </>
                  ) : (
                    <>You can not view this exam at this time.</>
                  )}
                </CardBody>
              </Card>
            </Col>
          )}
          {metaData.is_printonly && (
            <Col md={6} lg={4}>
              <PrintExam
                title="exam"
                examtype="exam"
                filename={metaData.filename}
              />
            </Col>
          )}
          {metaData.has_solution && metaData.solution_printonly && (
            <Col md={6} lg={4}>
              <PrintExam
                title="solution"
                examtype="solution"
                filename={metaData.filename}
              />
            </Col>
          )}
          {metaData.legacy_solution && (
            <Col md={6} lg={4}>
              <a
                href={metaData.legacy_solution}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="m-1">
                  <Button className="w-100 h-100 p-3">
                    Legacy Solution in VISki
                  </Button>
                </Card>
              </a>
            </Col>
          )}
          {metaData.legacy_solution && metaData.canEdit && (
            <Col md={6} lg={4}>
              <a
                href={`/legacy/transformwiki/${wikitransform}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="m-1">
                  <Button className="w-100 h-100 p-3">Transform Wiki</Button>
                </Card>
              </a>
            </Col>
          )}
          {metaData.master_solution && (
            <Col md={6} lg={4}>
              <a
                href={metaData.master_solution}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="m-1">
                  <Button className="w-100 h-100 p-3">
                    Official Solution (external)
                  </Button>
                </Card>
              </a>
            </Col>
          )}

          {metaData.has_solution && !metaData.solution_printonly && (
            <Col md={6} lg={4}>
              <a
                href={`/api/exam/pdf/solution/${metaData.filename}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="m-1">
                  <Button className="w-100 h-100 p-3">Official Solution</Button>
                </Card>
              </a>
            </Col>
          )}
          {metaData.attachments.map(attachment => (
            <Col md={6} lg={4} key={attachment.filename}>
              <a
                href={`/api/filestore/get/${attachment.filename}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="m-1">
                  <Button className="w-100 h-100 p-3">
                    {attachment.displayname}
                  </Button>
                </Card>
              </a>
            </Col>
          ))}
        </Row>
        {toc && (
          <Row form>
            <Col lg={12}>
              <TOC toc={toc} />
            </Col>
          </Row>
        )}
      </Container>

      <ContentContainer>
        <div ref={sizeRef} style={{ maxWidth, margin: "1em auto" }}>
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
              onSectionHiddenChange={onSectionHiddenChange}
              onAddCut={runAddCut}
              onMoveCut={runMoveCut}
              visibleChangeListener={visibleChangeListener}
              displayHiddenPdfSections={displayOptions.displayHiddenPdfSections}
              displayHiddenAnswerSections={
                displayOptions.displayHiddenAnswerSections
              }
              displayHideShowButtons={displayOptions.displayHideShowButtons}
            />
          )}
        </div>
      </ContentContainer>
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
        displayOptions={displayOptions}
        setDisplayOptions={setDisplayOptions}
      />
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
  useTitle(`${metaData?.displayname ?? filename} - VIS Community Solutions`);
  const {
    error: cutsError,
    loading: cutsLoading,
    data: cuts,
    run: reloadCuts,
    mutate: mutateCuts,
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
                mutateCuts={mutateCuts}
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
