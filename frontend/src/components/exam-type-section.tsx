import { useRequest } from "@umijs/hooks";
import {
  Anchor,
  Badge,
  Card,
  Checkbox,
  Flex,
  Grid,
  Group,
  Text,
  Title,
} from "@mantine/core";
import React from "react";
import examTypeClasses from "./exam-type-section.module.css";
import { Link, useHistory } from "react-router-dom";
import { fetchPost } from "../api/fetch-utils";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { CategoryExam } from "../interfaces";
import ClaimButton from "./claim-button";
import IconButton from "./icon-button";
import classes from "../utils/focus-outline.module.css";
import ExamGrid from "./exam-grid";
import { IconTrash } from "@tabler/icons-react";

const removeExam = async (filename: string) => {
  await fetchPost(`/api/exam/remove/exam/${filename}/`, {});
};

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
      <Group align="center" ml="md" mt="xl" mb="md">
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={e => setChecked(e.currentTarget.checked)}
        />
        <Title order={2}>{examtype}</Title>
      </Group>
      <ExamGrid>
        {exams.map(exam => (
          <Card
            shadow="md"
            withBorder
            className={classes.focusOutline}
            onKeyDown={e => {
              if (e.code === "Enter" && exam.canView) {
                history.push(`/exams/${exam.filename}`);
              }
            }}
            tabIndex={0}
            key={exam.filename}
          >
            <Grid>
              <Grid.Col span="content">
                <Checkbox
                  checked={selected.has(exam.filename)}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    e.currentTarget.checked
                      ? onSelect(exam.filename)
                      : onDeselect(exam.filename);
                  }}
                  disabled={!exam.canView}
                  mt="0.25em"
                />
              </Grid.Col>
              <Grid.Col span="auto">
                {exam.canView ? (
                  <Anchor
                    component={Link}
                    to={`/exams/${exam.filename}`}
                    size="lg"
                    fw={600}
                    mb="sm"
                  >
                    <Text fw={600}>{exam.displayname}</Text>
                  </Anchor>
                ) : (
                  exam.displayname
                )}
                <div>
                  {exam.remark && (
                    <Text color="dimmed" size="sm" mb="0.15em">
                      {exam.remark}
                    </Text>
                  )}
                  <Flex mt="0.2em" gap={4}>
                    {catAdmin &&
                      (exam.public ? (
                        <Badge className={examTypeClasses.badge}>public</Badge>
                      ) : (
                        <Badge className={examTypeClasses.badge}>hidden</Badge>
                      ))}
                    {exam.needs_payment && (
                      <Badge className={examTypeClasses.badge} color="blue">
                        oral
                      </Badge>
                    )}
                    {catAdmin &&
                      (exam.finished_cuts ? (
                        <Badge className={examTypeClasses.badge} color="green">
                          All done
                        </Badge>
                      ) : (
                        <Badge className={examTypeClasses.badge} color="orange">
                          Needs Cuts
                        </Badge>
                      ))}

                    {exam.is_printonly && (
                      <Badge
                        color="red"
                        className={examTypeClasses.badge}
                        title="This exam can only be printed. We can not provide this exam online."
                      >
                        Print Only
                      </Badge>
                    )}
                    <Badge
                      className={examTypeClasses.badge}
                      title={`There are ${exam.count_cuts} questions, of which ${exam.count_answered} have at least one solution.`}
                    >
                      {exam.count_answered} / {exam.count_cuts}
                    </Badge>
                    {exam.has_solution && (
                      <Badge title="Has an official solution." color="green">
                        Solution
                      </Badge>
                    )}
                  </Flex>
                </div>
                {catAdmin && (
                  <ClaimButton exam={exam} reloadExams={reload} mt="sm" />
                )}
              </Grid.Col>
              <Grid.Col span="content">
                {user.isAdmin && (
                  <IconButton
                    size="md"
                    color="red"
                    tooltip="Delete exam"
                    icon={<IconTrash />}
                    variant="outline"
                    onClick={(
                      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                    ) => handleRemoveClick(e, exam)}
                  />
                )}
              </Grid.Col>
            </Grid>
          </Card>
        ))}
      </ExamGrid>
    </>
  );
};

export default ExamTypeSection;
