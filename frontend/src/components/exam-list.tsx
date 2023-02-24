import {
  Alert,
  Button,
  Loader,
} from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import { Col, FormGroup, Row } from "@vseth/components";
import React, { useMemo, useState } from "react";
import { Icon, ICONS } from "vseth-canine-ui";
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
      {error && <Alert color="danger">{error}</Alert>}
      {loading && <Loader />}
      <Row className="d-flex flex-between">
        <Col md={6} xs={12} className="text-center text-md-left">
          <FormGroup className="mb-2 d-md-inline-block">
            <Button
              disabled={selected.size === 0}
              onClick={() => dlSelectedExams(getSelectedExams(selected))}
              leftIcon={<Icon icon={ICONS.DOWNLOAD} />}
            >
              Download selected exams
            </Button>
          </FormGroup>
        </Col>
        <Col md={6} xs={12} className="text-center text-md-right">
          <FormGroup className="d-md-inline-block">
            <div className="search mb-0">
              <input
                type="text"
                className="search-input"
                placeholder="Filter..."
                value={filter}
                onChange={e => setFilter(e.currentTarget.value)}
                autoFocus
              />
              <div className="search-icon-wrapper">
                <div className="search-icon" />
              </div>
            </div>
          </FormGroup>
        </Col>
      </Row>

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
    </>
  );
};
export default ExamList;
