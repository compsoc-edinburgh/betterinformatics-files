import {
  Alert,
  Button,
  Flex,
  Loader,
  Modal,
  Paper,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import React, { useMemo, useState } from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { loadList } from "../api/hooks";
import { useUser } from "../auth";
import Grid from "./grid";
import useSet from "../hooks/useSet";
import { CategoryMetaData, ExamSelectedForDownload } from "../interfaces";
import {
  dlSelectedExams,
  filterMatches,
  mapExamsToExamType,
} from "../utils/category-utils";
import ExamTypeSection from "./exam-type-section";
import UploadPdfCard from "./upload-pdf-card";

interface ExamListProps {
  metaData: CategoryMetaData;
}
const ExamList: React.FC<ExamListProps> = ({ metaData }) => {
  const {
    data,
    loading,
    error,
    run: reload,
  } = useRequest(() => loadList(metaData.slug), {
    refreshDeps: [metaData.slug],
    cacheKey: `exam-list-${metaData.slug}`,
  });
  const [filter, setFilter] = useState("");
  const { isCategoryAdmin } = useUser()!;
  const viewableExams = useMemo(
    () =>
      data &&
      data
        .filter(exam => exam.public || isCategoryAdmin)
        .filter(exam => filterMatches(filter, exam.displayname)),
    [data, isCategoryAdmin, filter],
  );
  const examTypeMap = useMemo(
    () => (viewableExams ? mapExamsToExamType(viewableExams) : undefined),
    [viewableExams],
  );
  const [selected, onSelect, onDeselect] = useSet<string>();

  const getSelectedExams = (selected: Set<string>) => {
    const selectedExams: ExamSelectedForDownload[] = [];
    if (data === undefined) return selectedExams;

    for (const exam of data) {
      if (selected.has(exam.filename))
        selectedExams.push({
          filename: exam.filename,
          displayname: exam.displayname,
        });
    }
    return selectedExams;
  };

  const [formIsOpen, setFormIsOpen] = useState(false);

  return (
    <>
      <Title order={2} mt="xl" mb="lg">
        Past Exams
      </Title>
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap="sm"
        mt="sm"
        mb="lg"
        justify="space-between"
      >
        <div>
          <Button
            disabled={selected.size === 0}
            onClick={() => dlSelectedExams(getSelectedExams(selected))}
            leftIcon={<Icon icon={ICONS.DOWNLOAD} />}
          >
            Download selected exams
          </Button>
        </div>
        <TextInput
          placeholder="Filter..."
          value={filter}
          autoFocus
          onChange={e => setFilter(e.currentTarget.value)}
          icon={<Icon icon={ICONS.SEARCH} size={14} />}
        />
      </Flex>
      {error && <Alert color="red">{error.message}</Alert>}
      {loading && <Loader />}

      {examTypeMap &&
        examTypeMap.map(
          ([examtype, exams]) =>
            exams.length > 0 && (
              <ExamTypeSection
                examtype={examtype}
                exams={exams}
                key={examtype}
                selected={selected}
                onSelect={onSelect}
                onDeselect={onDeselect}
                reload={reload}
              />
            ),
        )}
      {viewableExams && viewableExams.length === 0 && (
        <Alert variant="light" color="orange">
          No exams available to view.
        </Alert>
      )}

      <Modal
        opened={formIsOpen}
        title="Upload a new exam PDF"
        onClose={() => setFormIsOpen(r => !r)}
      >
        <Modal.Body>
          <UploadPdfCard preChosenCategory={metaData.slug} />
        </Modal.Body>
      </Modal>
      <Title order={3} mt="xl" mb="lg">
        Add Exams
      </Title>
      <Grid>
        <Paper withBorder shadow="md" style={{ minHeight: "6em" }}>
          <Tooltip label="Upload a new exam PDF">
            <Button
              style={{ width: "100%", height: "100%" }}
              onClick={() => setFormIsOpen(true)}
            >
              <Icon icon={ICONS.PLUS} size={40} />
            </Button>
          </Tooltip>
        </Paper>
      </Grid>
    </>
  );
};
export default ExamList;
