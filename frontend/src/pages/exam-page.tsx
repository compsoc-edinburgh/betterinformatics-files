import { useLocalStorageState, useRequest, useSize } from "ahooks";
import {
  Card,
  Breadcrumbs,
  Anchor,
  Loader,
  Alert,
  Container,
  Grid,
  Flex,
  Group,
  Button,
  useComputedColorScheme,
} from "@mantine/core";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { loadSections } from "../api/exam-loader";
import { fetchPost } from "../api/fetch-utils";
import {
  loadCuts,
  loadExamMetaData,
  loadSplitRenderer,
  markAsChecked,
} from "../api/hooks";
import { UserContext, useUser } from "../auth";
import Exam from "../components/exam";
import ExamMetadataEditor from "../components/exam-metadata-editor";
import ExamPanel from "../components/exam-panel";
import IconButton from "../components/icon-button";
import PrintExam from "../components/print-exam";
import ContentContainer from "../components/secondary-container";
import { TOC, TOCNode } from "../components/table-of-contents";
import useSet from "../hooks/useSet";
import useTitle from "../hooks/useTitle";
import {
  RECENT_EXAMS_KEY,
  pushRecentExam,
  RecentExam,
} from "../utils/recently-viewed-exams";
import {
  CutUpdate,
  EditMode,
  EditState,
  ExamMetaData,
  PdfSection,
  Section,
  SectionKind,
  ServerCutResponse,
} from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import { getAnswerSectionId } from "../utils/exam-utils";
import {
  IconChevronRight,
  IconDownload,
  IconEdit,
  IconFileCheck,
  IconLink,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useQuickSearchFilter } from "../components/Navbar/QuickSearch/QuickSearchFilterContext";

const addCut = async (
  filename: string,
  pageNum: number,
  relHeight: number,
  hidden = false,
  has_answers = true,
) => {
  await fetchPost(`/api/exam/addcut/${filename}/`, {
    pageNum,
    relHeight,
    name: "",
    hidden,
    has_answers,
  });
};

const updateCut = async (cut: string, update: Partial<CutUpdate>) => {
  await fetchPost(`/api/exam/editcut/${cut}/`, update);
};

interface ExamPageContentProps {
  metaData: ExamMetaData;
  sections?: Section[];
  renderer?: PDF;
  reloadCuts: () => void;
  mutateCuts: (mutation: (old: ServerCutResponse) => ServerCutResponse) => void;
  mutateMetaData: (
    x: ExamMetaData | undefined | ((data: ExamMetaData) => ExamMetaData),
  ) => void;
  goToEditPage: () => void;
}
const ExamPageContent: React.FC<ExamPageContentProps> = ({
  metaData,
  sections,
  renderer,
  reloadCuts,
  mutateCuts,
  mutateMetaData,
  goToEditPage,
}) => {
  const computedColorScheme = useComputedColorScheme();
  const { run: runMarkChecked } = useRequest(markAsChecked, {
    manual: true,
    onSuccess() {
      mutateMetaData(metaData => ({
        ...metaData,
        oral_transcript_checked: true,
      }));
    },
  });
  const user = useUser()!;
  const { run: runAddCut } = useRequest(addCut, {
    manual: true,
    onSuccess: reloadCuts,
  });
  const { run: runMoveCut } = useRequest(updateCut, {
    manual: true,
    onSuccess: () => {
      reloadCuts();
      setEditState({ mode: EditMode.None });
    },
  });
  const { run: runUpdate } = useRequest(updateCut, {
    manual: true,
    onSuccess: (_data, [oid, update]) => {
      mutateCuts(oldCuts =>
        Object.keys(oldCuts).reduce<ServerCutResponse>((result, key) => {
          result[key] = oldCuts[key].map(cutPosition =>
            cutPosition.oid === oid
              ? { ...cutPosition, ...update }
              : cutPosition,
          );
          return result;
        }, {}),
      );
    },
  });
  const onSectionChange = useCallback(
    async (section: string | [number, number], update: Partial<CutUpdate>) => {
      if (Array.isArray(section)) {
        await runAddCut(
          metaData.filename,
          section[0],
          section[1],
          update.hidden,
          false,
        );
      } else {
        await runUpdate(section, update);
      }
    },
    [runAddCut, metaData, runUpdate],
  );

  const sizeRef = useRef<HTMLDivElement>(null);
  const size = useSize(sizeRef);
  const [maxWidth, setMaxWidth] = useLocalStorageState("max-width", 1000);

  const [inViewSplits, addInViewSplit, removeInViewSplit] =
    useSet<PdfSection>();
  const [panelIsOpen, { toggle: togglePanel }] = useDisclosure();
  const [editState, setEditState] = useState<EditState>({
    mode: EditMode.None,
  });

  const inViewChangeListener = useCallback(
    (section: PdfSection, v: boolean) =>
      v ? addInViewSplit(section) : removeInViewSplit(section),
    [addInViewSplit, removeInViewSplit],
  );

  const width = size.width;
  const [displayOptions, setDisplayOptions] = useState({
    displayHiddenPdfSections: false,
    displayHiddenAnswerSections: false,
    displayHideShowButtons: false,
    displayEmptyCutLabels: false,
  });

  const inViewPages = useMemo(() => {
    const s = new Set<number>();
    for (const split of inViewSplits) {
      s.add(split.start.page);
    }
    return s;
  }, [inViewSplits]);

  const visiblePages = useMemo(() => {
    const s = new Set<number>();
    if (!sections) return undefined;
    for (const section of sections) {
      if (
        section.kind === SectionKind.Pdf &&
        (!section.hidden || displayOptions.displayHiddenPdfSections)
      ) {
        s.add(section.start.page);
      }
    }
    return s;
  }, [sections, displayOptions]);

  const [expandedSections, expandSections, collapseSections] = useSet<string>();
  const answerSections = useMemo(() => {
    if (sections === undefined) return;
    const answerSections: string[] = [];
    for (const section of sections) {
      if (section.kind === SectionKind.Answer) {
        answerSections.push(section.oid);
      }
    }
    return answerSections;
  }, [sections]);
  const allSectionsExpanded = useMemo(() => {
    if (answerSections === undefined) return true;
    return answerSections.every(section => expandedSections.has(section));
  }, [answerSections, expandedSections]);
  const allSectionsCollapsed = useMemo(() => {
    if (answerSections === undefined) return true;
    return !answerSections.some(section => expandedSections.has(section));
  }, [answerSections, expandedSections]);
  const collapseAllSections = useCallback(() => {
    if (answerSections === undefined) return;
    collapseSections(...answerSections);
  }, [collapseSections, answerSections]);
  const expandAllSections = useCallback(() => {
    if (answerSections === undefined) return;
    expandSections(...answerSections);
  }, [expandSections, answerSections]);

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
        const jumpTarget = getAnswerSectionId(section.oid, section.name);
        rootNode.add(parts, jumpTarget);
      }
    }
    if (rootNode.children.length === 0) return undefined;
    return rootNode;
  }, [sections]);

  return (
    <>
      <Container size="xl">
        <Flex justify="space-between" align="center">
          <h1>{metaData.displayname}</h1>
          <Group>
            <IconButton
              color="gray"
              icon={<IconDownload />}
              tooltip="Download"
              onClick={() => window.open(metaData.exam_file, "_blank")}
            />
            {user.isCategoryAdmin && (
              <>
                {user.isAdmin &&
                  metaData.is_oral_transcript &&
                  !metaData.oral_transcript_checked && (
                    <IconButton
                      color="gray"
                      tooltip="Mark as checked"
                      icon={<IconFileCheck />}
                      onClick={() => runMarkChecked(metaData.filename)}
                    />
                  )}
                <IconButton
                  color="gray"
                  icon={<IconEdit />}
                  tooltip="Edit"
                  onClick={() => goToEditPage()}
                />
              </>
            )}
          </Group>
        </Flex>
        {metaData.dark_mode_warning && computedColorScheme === "dark" && (
          <Alert color="yellow" title="Dark mode warning" mb="md">
            Images are inverted in dark mode. This exam is marked as
            particularly affected, so please switch to light mode for correct
            rendering.
          </Alert>
        )}
        <Grid>
          {!metaData.canView && (
            <Grid.Col span={{ md: 6, lg: 4 }}>
              <Card m="xs">
                {metaData.needs_payment && !metaData.hasPayed ? (
                  <>
                    You have to pay a deposit in order to see oral exams. After
                    submitting a report of your own oral exam you can get your
                    deposit back.
                  </>
                ) : (
                  <>You can not view this exam at this time.</>
                )}
              </Card>
            </Grid.Col>
          )}
          {metaData.is_printonly && (
            <Grid.Col span={{ md: 6, lg: 4 }}>
              <PrintExam
                title="exam"
                examtype="exam"
                filename={metaData.filename}
              />
            </Grid.Col>
          )}
          {metaData.has_solution && metaData.solution_printonly && (
            <Grid.Col span={{ md: 6, lg: 4 }}>
              <PrintExam
                title="solution"
                examtype="solution"
                filename={metaData.filename}
              />
            </Grid.Col>
          )}
          {metaData.master_solution && (
            <Grid.Col span={{ md: 4, lg: 3 }}>
              <Button
                fullWidth
                color="gray"
                component="a"
                variant="light"
                href={metaData.master_solution}
                target="_blank"
                rel="noopener noreferrer"
                leftSection={<IconLink />}
              >
                Official Solution (external)
              </Button>
            </Grid.Col>
          )}

          {metaData.has_solution && !metaData.solution_printonly && (
            <Grid.Col span={{ md: 4, lg: 3 }}>
              <Button
                fullWidth
                color="gray"
                component="a"
                href={metaData.solution_file}
                variant="light"
                target="_blank"
                rel="noopener noreferrer"
                leftSection={<IconDownload />}
              >
                Official Solution
              </Button>
            </Grid.Col>
          )}
          {metaData.attachments.map(attachment => (
            <Grid.Col span={{ md: 4, lg: 3 }} key={attachment.filename}>
              <Button
                fullWidth
                component="a"
                variant="light"
                href={`/api/filestore/get/${attachment.filename}/`}
                target="_blank"
                rel="noopener noreferrer"
                leftSection={<IconDownload />}
              >
                {attachment.displayname}
              </Button>
            </Grid.Col>
          ))}
        </Grid>
        {toc && (
          <Grid>
            <Grid.Col span={{ lg: 12 }}>
              <TOC toc={toc} />
            </Grid.Col>
          </Grid>
        )}
      </Container>

      <ContentContainer>
        <Container ref={sizeRef} style={{ maxWidth }} my="sm" px="xs">
          {width && sections && renderer && (
            <Exam
              metaData={metaData}
              sections={sections}
              width={width}
              editState={editState}
              setEditState={setEditState}
              reloadCuts={reloadCuts}
              renderer={renderer}
              onUpdateCut={onSectionChange}
              onAddCut={runAddCut}
              onMoveCut={runMoveCut}
              inViewChangeListener={inViewChangeListener}
              displayHiddenPdfSections={displayOptions.displayHiddenPdfSections}
              displayHiddenAnswerSections={
                displayOptions.displayHiddenAnswerSections
              }
              displayEmptyCutLabels={displayOptions.displayEmptyCutLabels}
              displayHideShowButtons={displayOptions.displayHideShowButtons}
              expandedSections={expandedSections}
              onCollapseSections={collapseSections}
              onExpandSections={expandSections}
            />
          )}
        </Container>
      </ContentContainer>
      <ExamPanel
        isOpen={panelIsOpen}
        toggle={togglePanel}
        metaData={metaData}
        renderer={renderer}
        inViewPages={inViewPages}
        visiblePages={visiblePages}
        allSectionsExpanded={allSectionsExpanded}
        allSectionsCollapsed={allSectionsCollapsed}
        onCollapseAllSections={collapseAllSections}
        onExpandAllSections={expandAllSections}
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

const ExamPage: React.FC = () => {
  const { filename } = useParams() as { filename: string };
  const {
    error: metaDataError,
    loading: metaDataLoading,
    data: metaData,
    mutate: setMetaData,
  } = useRequest(() => loadExamMetaData(filename), {
    cacheKey: `exam-metaData-${filename}`,
    refreshDeps: [filename],
  });
  useTitle(metaData?.displayname ?? filename);
  useEffect(() => {
    if (!metaData) return;
    try {
      const raw = localStorage.getItem(RECENT_EXAMS_KEY);
      const list: RecentExam[] = raw ? JSON.parse(raw) : [];
      const updated = pushRecentExam(list, {
        filename: metaData.filename,
        displayname: metaData.displayname,
        category: metaData.category,
        category_displayname: metaData.category_displayname,
      });
      localStorage.setItem(RECENT_EXAMS_KEY, JSON.stringify(updated));
    } catch {
      // corrupted localStorage entry — silently ignore
    }
  }, [metaData?.filename]);
  useQuickSearchFilter(
    metaData && {
      slug: metaData.category,
      displayname: metaData.category_displayname,
    },
  );
  const {
    error: cutsError,
    loading: cutsLoading,
    data: cuts,
    run: reloadCuts,
    mutate: mutateCuts,
  } = useRequest(() => loadCuts(filename), {
    cacheKey: `exam-cuts-${filename}`,
    refreshDeps: [filename],
  });
  const {
    error: pdfError,
    loading: pdfLoading,
    data,
  } = useRequest(
    () => {
      if (metaData === undefined) return Promise.resolve(undefined);
      const examFile = metaData.exam_file;
      if (examFile === undefined) return Promise.resolve(undefined);
      return loadSplitRenderer(examFile);
    },
    { refreshDeps: [metaData === undefined, metaData?.exam_file] },
  );
  const [pdf, renderer] = !pdfLoading && data ? data : [];
  const sections = useMemo(
    () => (cuts && pdf ? loadSections(pdf.numPages, cuts) : undefined),
    [pdf, cuts],
  );
  const error = metaDataError ?? cutsError ?? pdfError;
  const user = useUser()!;

  const navigate = useNavigate();

  return (
    <div key={filename}>
      <Container size="xl">
        <Breadcrumbs separator={<IconChevronRight />}>
          <Anchor component={Link} tt="uppercase" size="xs" to="/">
            Home
          </Anchor>
          <Anchor
            tt="uppercase"
            size="xs"
            component={Link}
            to={`/category/${metaData ? metaData.category : ""}`}
          >
            {metaData?.category_displayname}
          </Anchor>
          <Anchor tt="uppercase" size="xs">
            {metaData?.displayname}
          </Anchor>
        </Breadcrumbs>
      </Container>
      <div>
        {error && (
          <Container>
            <Alert color="red">{error.toString()}</Alert>
          </Container>
        )}
        {metaDataLoading && (
          <Container>
            <Loader />
          </Container>
        )}
        {!metaDataLoading && metaData && (
          <Routes>
            <Route
              path="edit"
              element={
                !user.isAdmin && !metaData.canEdit ? (
                  <Navigate to="./.." replace />
                ) : (
                  <Container size="xl">
                    <ExamMetadataEditor
                      currentMetaData={metaData}
                      closeEditPage={() => navigate("./..")}
                      onMetaDataChange={setMetaData}
                    />
                  </Container>
                )
              }
            />
            <Route
              path="/"
              element={
                <UserContext.Provider
                  value={{
                    ...user,
                    isExpert: user.isExpert ?? metaData.isExpert,
                    isCategoryAdmin: user.isAdmin || metaData.canEdit,
                  }}
                >
                  <ExamPageContent
                    metaData={metaData}
                    sections={sections}
                    renderer={renderer}
                    reloadCuts={reloadCuts}
                    mutateCuts={mutateCuts}
                    mutateMetaData={setMetaData}
                    goToEditPage={() => navigate("./edit")}
                  />
                </UserContext.Provider>
              }
            />
            <Route path="*" element={<Navigate to="./.." replace />} />
          </Routes>
        )}
        {(cutsLoading || pdfLoading) && !metaDataLoading && (
          <Container>
            <Loader />
          </Container>
        )}
      </div>
    </div>
  );
};
export default ExamPage;
