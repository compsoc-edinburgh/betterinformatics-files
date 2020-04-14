import { useRequest } from "@umijs/hooks";
import { Badge, Card, CardHeader, Table } from "@vseth/components";
import { css } from "emotion";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import { fetchPost } from "../api/fetch-utils";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { CategoryExam } from "../interfaces";
import ClaimButton from "./claim-button";
import IconButton from "./icon-button";
import TwoButtons from "./two-buttons";

const removeExam = async (filename: string) => {
  await fetchPost(`/api/exam/remove/exam/${filename}/`, {});
};

const badgeStyle = css`
  margin: 3px;
  font-size: 0.85rem !important;
`;

interface ExamTypeCardProps {
  examtype: string;
  exams: CategoryExam[];
  selected: Set<string>;
  onSelect: (...filenames: string[]) => void;
  onDeselect: (...filenames: string[]) => void;
  reload: () => void;
}
const ExamTypeCard: React.FC<ExamTypeCardProps> = ({
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
      <Card className="my-1">
        <CardHeader tag="h4">{examtype}</CardHeader>
        <div style={{ overflow: "scroll" }}>
          <Table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={checked}
                    ref={el => el && (el.indeterminate = indeterminate)}
                    onChange={e => setChecked(e.currentTarget.checked)}
                  />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr
                  key={exam.filename}
                  style={{ cursor: "pointer" }}
                  onClick={() => history.push(`/exams/${exam.filename}`)}
                >
                  <td
                    onClick={e => e.stopPropagation()}
                    style={{
                      cursor: "initial",
                      width: "1%",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(exam.filename)}
                      onChange={e =>
                        e.currentTarget.checked
                          ? onSelect(exam.filename)
                          : onDeselect(exam.filename)
                      }
                      disabled={!exam.canView}
                    />
                  </td>
                  <td>
                    <h6>
                      <TwoButtons
                        left={
                          exam.canView ? (
                            <Link to={`/exams/${exam.filename}`}>
                              {exam.displayname}
                            </Link>
                          ) : (
                            exam.displayname
                          )
                        }
                        right={
                          catAdmin && (
                            <ClaimButton exam={exam} reloadExams={reload} />
                          )
                        }
                      />
                    </h6>
                    {user.isAdmin && (
                      <IconButton
                        close
                        tooltip="Delete exam"
                        icon="DELETE"
                        onClick={e => handleRemoveClick(e, exam)}
                      />
                    )}
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
                        <Badge
                          title="Has an official solution."
                          color="success"
                        >
                          Solution
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </>
  );
};

export default ExamTypeCard;
