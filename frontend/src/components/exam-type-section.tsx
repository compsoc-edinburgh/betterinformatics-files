import { useRequest } from "@umijs/hooks";
import {
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
import { Link } from "react-router-dom";
import { fetchPost } from "../api/fetch-utils";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { CategoryExam } from "../interfaces";
import ClaimButton from "./claim-button";
import IconButton from "./icon-button";
import clsx from "clsx";
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
    // Prevent the click event from propagating to the containing card.
    e.stopPropagation();
    e.preventDefault();
    confirm(
      `Remove the exam named ${exam.displayname}? This will remove all answers and can not be undone!`,
      () => runRemoveExam(exam.filename),
    );
  };

  const clickOnExam = (exam: CategoryExam) => {
    // If there are exams selected already, then clicking on an exam will behave
    // as if we clicked on the checkbox. This is to make the UX less prone to
    // inadvertently clicking on exams and navigating away, losing the selection.
    if (someSelected) {
      if (selected.has(exam.filename)) {
        onDeselect(exam.filename);
      } else {
        onSelect(exam.filename);
      }
    }
    // If there are no exams selected, the Link component will handle the click.
  }

  return (
    <>
      {modals}
      <Group align="center" mt="xl" mb="md">
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={e => setChecked(e.currentTarget.checked)}
        />
        <Title order={3}>{examtype}</Title>
      </Group>
      <ExamGrid>
        {exams.map(exam => (
          <Card
            withBorder
            className={clsx(classes.focusOutline, classes.hoverShadow)}
            // Add onClick and onKeydown functionality for when the component
            // is not a Link, i.e. when there are exams selected.
            onClick={(_e: any) => clickOnExam(exam)}
            onKeyDown={(e: any) => { if (e.code === "Enter") clickOnExam(exam) }}
            tabIndex={0}
            key={exam.filename}
            fw={600}
            // Prevent navigating away when there are exams selected.
            component={(someSelected ? undefined : Link) as any}
            style={{ cursor: someSelected ? 'default' : 'pointer' }}
            to={`/exams/${exam.filename}`}
          >
            <Grid>
              <Grid.Col span="content">
                <Checkbox
                  mt="0.25em"
                  checked={selected.has(exam.filename)}
                  // Prevent the click event from propagating to the containing
                  // card's handlers.
                  onClick={e => e.stopPropagation()}
                  // Toggle the selection state in the parent component.
                  onChange={e => {
                    e.currentTarget.checked
                      ? onSelect(exam.filename)
                      : onDeselect(exam.filename);
                  }}
                  // Might be obsolete code below, unviewable exams should be
                  // filtered already at this point.
                  disabled={!exam.canView}
                />
              </Grid.Col>
              <Grid.Col span="auto">
                {exam.canView ? (
                  <Text fw={600} size="lg">{exam.displayname}</Text>
                ) : (
                  exam.displayname
                )}
                <div>
                  {exam.remark && (
                    <Text color="dimmed" size="sm" mb="0.15em">
                      {exam.remark}
                    </Text>
                  )}
                  <Flex mt="0.2em" gap={4} wrap="wrap">
                    {catAdmin &&
                      (exam.public ? (
                        <Badge className={examTypeClasses.badge}>public</Badge>
                      ) : (
                        <Badge className={examTypeClasses.badge}>hidden</Badge>
                      ))}
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
