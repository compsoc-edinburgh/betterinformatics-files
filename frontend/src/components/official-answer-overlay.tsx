import {
  Button,
  Center,
  Grid,
  Group,
  Modal,
  Pagination,
  Radio,
  Select,
} from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadAllCategories, loadExamMetaData, loadList } from "../api/hooks.js";
import { useRequest } from "ahooks";
import { createOptions, options } from "../utils/ts-utils.js";
import { usePdfUrl } from "./official-solution.js";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
  RenderTask,
} from "pdfjs-dist";
import { getDocument } from "../pdf/pdfjs.js";
import { ReactCrop, type Crop } from "react-image-crop";

import "react-image-crop/dist/ReactCrop.css";
import type { ExamMetaData } from "../interfaces.js";
import { useLocation } from "react-router-dom";
import { ReactRouterLocation } from "@grafana/faro-react";

function formatCoordinate(c: number): string {
  const rounded = Math.round(c * 1e6) / 1e6;

  if (rounded <= 0) return "0";
  if (rounded >= 1) return "1";
  return `${rounded}`;
}

function formatOfficialAnswerMarkdown(
  url: string,
  page: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  return `\`\`\`official
page: ${page}
from-relative-coords: (${formatCoordinate(fromX)}, ${formatCoordinate(fromY)})
to-relative-coords: (${formatCoordinate(toX)}, ${formatCoordinate(toY)})
url: ${url}
\`\`\``;
}

async function pdfUrlPrefill(
  url: Location | ReactRouterLocation,
): Promise<ExamMetaData | undefined> {
  if (url.pathname.startsWith("/exams/")) {
    const exam = url.pathname.slice("/exams/".length);
    try {
      const metadata = await loadExamMetaData(exam);
      return metadata;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

interface PdfSelectorProps {
  selectedPdf: string;
  onCrop: (markdown: string) => void;
}

const PdfCutter: React.FC<PdfSelectorProps> = ({ selectedPdf, onCrop }) => {
  const { url: pdfUrl, loading } = usePdfUrl(selectedPdf);
  const [pdfObject, setPdfObject] = useState<PDFDocumentProxy | null>();
  const [page, setPage] = useState(1);
  const [containerRect, setContainerRect] = useState<{
    width: number;
    height: number;
  }>({
    width: 1,
    height: 1,
  });
  const [crop, setCrop] = useState<Crop>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track width of container to render pdf at full width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerRect(entry.contentRect);
          setCrop(undefined);
        }
      }
    });

    resizeObserver.observe(container);
    // Set initial width
    if (container.offsetWidth > 0) {
      setContainerRect({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Loading PDF, to get amount of pages
  // and speed up rendering later when page changes
  useEffect(() => {
    if (!pdfUrl || !canvasRef.current) return;
    let active = true;

    async function loadPdf() {
      const loadingTask: PDFDocumentLoadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      if (active) {
        setPage(1);
        setPdfObject(pdf);
        setCrop(undefined);
      }
    }

    void loadPdf();

    return () => {
      active = false;
    };
  }, [pdfUrl, canvasRef]);

  // Rerender pdf when page, pdf, width changes
  useEffect(() => {
    if (!pdfObject || !canvasRef.current) return;

    let active = true;
    let renderTask: RenderTask | undefined;

    async function renderPdf() {
      const pdfPage = await pdfObject!.getPage(page);

      if (!active) return;

      const unscaledViewport = pdfPage.getViewport({ scale: 1 });
      const scale = containerRect.width / unscaledViewport.width;

      const viewport = pdfPage.getViewport({ scale });

      const canvas = canvasRef.current;

      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = pdfPage.render({
          canvas,
          viewport,
        });
      }
    }

    void renderPdf();

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [pdfObject, page, containerRect]);

  if (!pdfUrl && !loading) {
    return <>Could not fetch PDF.</>;
  }

  function handleInsert() {
    if (!crop) return;

    const fromX = crop.x / containerRect.width;
    const fromY = crop.y / containerRect.height;
    const toX = (crop.x + crop.width) / containerRect.width;
    const toY = (crop.y + crop.height) / containerRect.height;

    onCrop(
      formatOfficialAnswerMarkdown(selectedPdf, page, fromX, fromY, toX, toY),
    );
  }

  return (
    <>
      {pdfObject && (
        <>
          <Grid.Col span={{ md: 9 }}>
            <Center>
              <Pagination
                value={page}
                total={pdfObject.numPages}
                onChange={value => {
                  setPage(value);
                }}
              />
            </Center>
          </Grid.Col>
          <Grid.Col span={{ md: 3 }}>
            <Center>
              <Button
                disabled={!crop?.width || !crop.height}
                onClick={handleInsert}
              >
                Insert
              </Button>
            </Center>
          </Grid.Col>
        </>
      )}
      <Grid.Col ref={containerRef}>
        <Center>
          <ReactCrop crop={crop} onChange={crop => setCrop(crop)}>
            <canvas ref={canvasRef} style={{ borderRadius: 5 }} />
          </ReactCrop>
        </Center>
      </Grid.Col>
    </>
  );
};

const enum SelectedPdf {
  Exam = "Exam",
  Solution = "Solution",
}

interface NavigatorProps {
  onCrop: (markdown: string) => void;
}

const ExamNavigator: React.FC<NavigatorProps> = ({ onCrop }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );
  const [selectedExam, setSelectedExam] = useState<string | undefined>(
    undefined,
  );
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | undefined>(
    undefined,
  );
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function loadPrefillData() {
      const examMetadata = await pdfUrlPrefill(location);
      if (examMetadata && active) {
        setSelectedCategory(examMetadata.category);
        setSelectedExam(examMetadata.filename);
      }
    }

    void loadPrefillData();

    return () => {
      active = false;
    };
  }, [location]);

  const { data: categories } = useRequest(loadAllCategories, {
    cacheKey: "categories",
  });
  const categoriesMap = useMemo(
    () =>
      categories &&
      createOptions(
        Object.fromEntries(
          categories
            .filter(category => category.slug !== "default")
            .map(category => [category.slug, category.displayname] as const),
        ),
      ),
    [categories],
  );

  const { data: exams } = useRequest(
    () =>
      selectedCategory
        ? loadList(selectedCategory)
        : Promise.resolve(undefined),
    {
      cacheKey: `exam-list-${selectedCategory}`,
      refreshDeps: [selectedCategory],
    },
  );
  const examsMap = useMemo(
    () =>
      exams &&
      createOptions(
        Object.fromEntries(
          exams.map(exam => [exam.filename, exam.displayname] as const),
        ),
      ),
    [exams],
  );

  const { loading: examMetadataLoading, data: examMetadata } = useRequest(
    () =>
      selectedExam
        ? loadExamMetaData(selectedExam)
        : Promise.resolve(undefined),
    {
      cacheKey: `exam-metaData-${selectedExam}`,
      refreshDeps: [selectedExam],
    },
  );

  const solutionFile =
    examMetadataLoading || !examMetadata ? false : examMetadata.has_solution;
  const examFile = !examMetadataLoading && examMetadata;

  useEffect(() => {
    if (
      selectedCategory &&
      selectedExam &&
      examMetadata &&
      !examMetadataLoading
    ) {
      // Eagerly load solution or else exam
      setSelectedPdf(
        examMetadata.has_solution ? SelectedPdf.Solution : SelectedPdf.Exam,
      );
    }
  }, [selectedCategory, selectedExam, examMetadata, examMetadataLoading]);

  return (
    <div onClick={e => e.stopPropagation()}>
      <Grid>
        <Grid.Col span={{ md: 6 }}>
          <Select
            label="Category"
            data={categoriesMap ? options(categoriesMap) : undefined}
            value={selectedCategory ?? null}
            placeholder="Select category"
            searchable
            onChange={(value: string | null) => {
              if (value) {
                setSelectedCategory(value);
                setSelectedExam(undefined);
                setSelectedPdf(undefined);
              }
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ md: 6 }}>
          {selectedCategory && (
            <Select
              label="Exam"
              data={examsMap ? options(examsMap) : undefined}
              value={selectedExam ?? null}
              placeholder="Select exam"
              onChange={(value: string | null) => {
                if (value) {
                  setSelectedExam(value);
                  setSelectedPdf(undefined);
                }
              }}
            />
          )}
        </Grid.Col>

        <Grid.Col>
          <Radio.Group
            value={selectedPdf}
            onChange={value => {
              setSelectedPdf(value as SelectedPdf);
            }}
          >
            <Center>
              <Group>
                <Radio
                  defaultChecked={!solutionFile}
                  disabled={!examFile}
                  value={SelectedPdf.Exam}
                  label="Cut from Exam"
                />
                <Radio
                  defaultChecked={solutionFile}
                  disabled={!solutionFile}
                  value={SelectedPdf.Solution}
                  label="Cut from Official Solution"
                />
              </Group>
            </Center>
          </Radio.Group>
        </Grid.Col>

        {selectedPdf && (
          <PdfCutter
            selectedPdf={
              selectedPdf === SelectedPdf.Solution
                ? `solution/${selectedExam}`
                : `exam/${selectedExam}`
            }
            onCrop={onCrop}
          />
        )}
      </Grid>
    </div>
  );
};

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  closeWithOfficialAnswer: (markdown: string) => void;
}

const OfficialAnswerOverlay: React.FC<OverlayProps> = ({
  isOpen,
  onClose,
  closeWithOfficialAnswer,
}) => {
  return (
    <Modal title="Embed PDF" size="lg" opened={isOpen} onClose={onClose}>
      <Modal.Body>
        <ExamNavigator onCrop={closeWithOfficialAnswer} />
      </Modal.Body>
    </Modal>
  );
};

export default OfficialAnswerOverlay;
