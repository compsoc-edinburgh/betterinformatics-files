import { useRequest } from "@umijs/hooks";
import { Badge, Card, Col, Row } from "@vseth/components";
import { css } from "emotion";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import { fetchPost } from "../api/fetch-utils";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { CategoryExam } from "../interfaces";
import ClaimButton from "./claim-button";
import IconButton from "./icon-button";

const removeExam = async (filename: string) => {
  await fetchPost(`/api/exam/remove/exam/${filename}/`, {});
};

const badgeStyle = css`
  margin: 0.15rem;
  font-size: 0.85rem !important;
`;
const cursorPointer = css`
  cursor: pointer;
  &:focus {
    outline: 1.5px solid var(--gray-dark);
    outline-offset: 2px;
  }
`;
interface ExamTypeCardProps {
  examtype: string;
  exams: CategoryExam[];
  selected: Set<string>;
  onSelect: (...filenames: string[]) => void;
  onDeselect: (...filenames: string[]) => void;
  reload: () => void;
}
const ExamTypeSection: React.FC<ExamTypeCardProps> = ({
  examtype,
  exams,

  selected,
  onSelect,
  onDeselect,
  reload,
}) => {
  const user = useUser()!;
  const catAdmin = user.isCategoryAdmin;
  const history = useHistory();
  const allSelected = exams.every(exam => selected.has(exam.filename));
  const someSelected = exams.some(exam => selected.has(exam.filename));
  const checked = someSelected;
  const indeterminate = someSelected && !allSelected;
  const setChecked = (newValue: boolean) => {
    if (newValue) onSelect(...exams.map(exam => exam.filename));
    else onDeselect(...exams.map(exam => exam.filename));
  };
  const [confirm, modals] = useConfirm();
  const { run: runRemoveExam } = useRequest(removeExam, {
    manual: true,
    onSuccess: reload,
  });
  const handleRemoveClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    exam: CategoryExam,
  ) => {
    e.stopPropagation();
    confirm(
      `Remove the exam named ${exam.displayname}? This will remove all answers and can not be undone!`,
      () => runRemoveExam(exam.filename),
    );
  };

  return (
    <>
      {modals}

      <h3 className="my-3 d-flex align-items-center">
        <input
          className="mr-3"
          type="checkbox"
          checked={checked}
          ref={el => el && (el.indeterminate = indeterminate)}
          onChange={e => setChecked(e.currentTarget.checked)}
        />
        {examtype}
      </h3>
      <Row form>
        {exams.map(exam => (
          <Col key={exam.filename} sm={12} md={6} lg={4}>
            <Card
              className={`${exam.canView ? cursorPointer : ""} my-1`}
              onClick={() =>
                exam.canView && history.push(`/exams/${exam.filename}`)
              }
              onKeyDown={e => {
                if (e.keyCode === 13 && exam.canView) {
                  history.push(`/exams/${exam.filename}`);
                }
              }}
              tabIndex={0}
              body
            >
              <Row>
                <Col xs="auto">
                  <input
                    type="checkbox"
                    checked={selected.has(exam.filename)}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      e.currentTarget.checked
                        ? onSelect(exam.filename)
                        : onDeselect(exam.filename);
                    }}
                    disabled={!exam.canView}
                  />
                </Col>
                <Col>
                  <Row>
                    <Col>
                      <h6 className="mb-3">
                        {exam.canView ? (
                          <Link
                            to={`/exams/${exam.filename}`}
                            className="text-dark"
                          >
                            {exam.displayname}
                          </Link>
                        ) : (
                          exam.displayname
                        )}
                      </h6>
                    </Col>
                    <Col xs="auto">
                      {user.isAdmin && (
                        <IconButton
                          size="sm"
                          color="white"
                          tooltip="Delete exam"
                          icon="DELETE"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveClick(e, exam);
                          }}
                        />
                      )}
                      {catAdmin && (
                        <ClaimButton exam={exam} reloadExams={reload} />
                      )}
                    </Col>
                  </Row>
                  <div>
                    {catAdmin && exam.public ? (
                      <Badge className={badgeStyle} color="primary">
                        public
                      </Badge>
                    ) : (
                      <Badge className={badgeStyle} color="primary">
                        hidden
                      </Badge>
                    )}
                    {exam.needs_payment && (
                      <Badge className={badgeStyle} color="info">
                        oral
                      </Badge>
                    )}
                    {exam.finished_cuts ? (
                      exam.finished_wiki_transfer ? (
                        <Badge className={badgeStyle} color="success">
                          All done
                        </Badge>
                      ) : (
                        <Badge className={badgeStyle} color="info">
                          Needs Wiki Import
                        </Badge>
                      )
                    ) : (
                      <Badge className={badgeStyle} color="warning">
                        Needs Cuts
                      </Badge>
                    )}

                    {exam.remark && (
                      <Badge className={badgeStyle} color="dark">
                        {exam.remark}
                      </Badge>
                    )}
                    {exam.is_printonly && (
                      <Badge
                        color="danger"
                        className={badgeStyle}
                        title="This exam can only be printed. We can not provide this exam online."
                      >
                        (Print Only)
                      </Badge>
                    )}
                    <Badge
                      color="secondary"
                      className={badgeStyle}
                      title={`There are ${exam.count_cuts} questions, of which ${exam.count_answered} have at least one solution.`}
                    >
                      {exam.count_answered} / {exam.count_cuts}
                    </Badge>
                    {exam.has_solution && (
                      <Badge title="Has an official solution." color="success">
                        Solution
                      </Badge>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default ExamTypeSection;
