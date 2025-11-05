import { Alert, alpha, Button, Flex, Loader, Popover, TextInput } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import React, { useMemo, useState } from "react";
import { loadList } from "../api/hooks";
import { useUser } from "../auth";
import useSet from "../hooks/useSet";
import { CategoryMetaData, ExamSelectedForDownload } from "../interfaces";
import {
  dlSelectedExams,
  filterMatches,
  mapExamsToExamType,
} from "../utils/category-utils";
import ExamTypeSection from "./exam-type-section";
import { IconDownload, IconSearch , IconMessage, IconQuestionMark} from "@tabler/icons-react";
import { Link } from "react-router-dom";

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

  return (
    <>
      {error && <Alert color="red">{error.message}</Alert>}
      {loading && <Loader />}
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap="sm"
        mt="sm"
        mb="lg"
        justify="space-between"
        align="center"
      >
        {/* Left group: Download + Missing Exams */}
        <Flex gap="sm" align="center">
          <Button
            disabled={selected.size === 0}
            onClick={() => dlSelectedExams(getSelectedExams(selected))}
            leftSection={<IconDownload />}
          >
            Download selected exams
          </Button>

          {(examTypeMap &&
            examTypeMap.reduce((acc, [_examtype, exams]) => acc + exams.length, 0) <=
              3 && (
              <Popover width={300} position="bottom" withArrow shadow="md">
                <Popover.Target>
                  <Button
                    onClick={() => {
                      return;
                    }}
                    color={"gray"}
                    variant="subtle"
                  >
                    Missing Exams?
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  This category has very few exams. If you would like to request an exam to be added to the collection,{' '}
                  <Link to="/feedback" style={{ textDecoration: 'none'}}>
                    send us feedback!
                  </Link>
                </Popover.Dropdown>
              </Popover>
            ))}
        </Flex>

        {/* Right: Filter */}
        <TextInput
          placeholder="Filter..."
          value={filter}
          autoFocus
          onChange={e => setFilter(e.currentTarget.value)}
          leftSection={<IconSearch style={{ height: '15px', width: '15px' }} />}
        />
      </Flex>

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
        )
      }
    </>
  );
};
export default ExamList;
