import { useRequest } from "ahooks";
import {
  Anchor,
  Badge,
  Box,
  Checkbox,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import React from "react";
import examTypeClasses from "./exam-type-section.module.css";
import fadeClasses from "../utils/fade-in-order.module.css";
import { Link } from "react-router-dom";
import { useUser } from "../auth";
import useRemoveConfirm from "../hooks/useRemoveConfirm";
import { CategoryExam } from "../interfaces";
import ClaimButton from "./claim-button";
import IconButton from "./icon-button";
import { clsx } from "clsx";
import {
  IconChecklist,
  IconEyeOff,
  IconFileCertificate,
  IconPencilCheck,
  IconScissors,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react";
import {
  markExamUserSolved,
  removeExam,
  unmarkExamUserSolved,
} from "../api/hooks";
import { StatusIcon } from "./status-icon";

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
  const [removeConfirm, modals] = useRemoveConfirm();
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
    removeConfirm(
      `Remove the exam named ${exam.displayname}? This will remove all answers and can not be undone!`,
      () => runRemoveExam(exam.filename),
    );
  };

  async function handleToggleUserSolved(
    event: React.SyntheticEvent,
    exam: CategoryExam,
  ) {
    event.stopPropagation();
    event.preventDefault();

    if (exam.user_solved) {
      await unmarkExamUserSolved(exam.filename);
    } else {
      await markExamUserSolved(exam.filename);
    }

    reload();
  }

  const contiguousAnswered = (exam: CategoryExam) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    return [...exam.answered_bits, "1"].reduce<
      { bit: string; count: number; index: number }[]
    >((acc, b, index) => {
      if (acc.length === 0) {
        return [{ bit: b, count: 1, index }];
      }
      if (b === acc[acc.length - 1].bit) {
        acc[acc.length - 1].count += 1;
        return acc;
      } else {
        acc.push({ bit: b, count: 1, index });
        return acc;
      }
    }, []);
  };

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
      <Box className={examTypeClasses.examTable}>
        {exams.map(exam => (
          <Group
            key={exam.filename}
            className={clsx(examTypeClasses.examRow, fadeClasses.fadeInOrder)}
            align="center"
            wrap="nowrap"
            gap="md"
          >
            <Checkbox
              checked={selected.has(exam.filename)}
              // Toggle the selection state in the parent component.
              onChange={e =>
                e.currentTarget.checked
                  ? onSelect(exam.filename)
                  : onDeselect(exam.filename)
              }
              // Might be obsolete code below, unviewable exams should be
              // filtered already at this point.
              disabled={!exam.canView}
              flex="0 0 auto"
            />
            <Stack gap={0} flex={1} className={clsx(examTypeClasses.examLink)}>
              <Group gap="xs">
                {exam.canView ? (
                  <Anchor component={Link} to={`/exams/${exam.filename}`}>
                    <Text size="md">{exam.displayname}</Text>
                  </Anchor>
                ) : (
                  exam.displayname
                )}
                {exam.has_solution && (
                  <StatusIcon
                    tooltip="Official Solutions Available"
                    icon={IconFileCertificate}
                    color="blue"
                  />
                )}
              </Group>
              {exam.remark && (
                <Text c="dimmed" size="sm" mb="0.15em">
                  {exam.remark}
                </Text>
              )}
            </Stack>
            <Group gap={4} wrap="nowrap">
              <Tooltip
                label={`${exam.count_answered}/${exam.count_cuts} questions have an answer.`}
              >
                <svg width="100" height="25" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="10"
                    fill="transparent"
                  />
                  {contiguousAnswered(exam).map(({ bit, count, index }) => (
                    <rect
                      x={((index * 100) / exam.answered_bits.length).toFixed(2)}
                      y="10"
                      width={(count * 100) / exam.answered_bits.length}
                      height="5"
                      fill={
                        bit === "1"
                          ? "var(--mantine-primary-color-filled)"
                          : "var(--mantine-primary-color-light)"
                      }
                      key={index}
                    />
                  ))}
                  <rect
                    x="0"
                    y="15"
                    width="100"
                    height="10"
                    fill="transparent"
                  />
                </svg>
              </Tooltip>
            </Group>
            {catAdmin && !exam.finished_cuts && (
              <ClaimButton exam={exam} reloadExams={reload} size="compact-sm" />
            )}
            <Group gap="xs" wrap="nowrap">
              <IconButton
                size="sm"
                color={exam.user_solved ? "grape" : "gray"}
                tooltip={
                  exam.user_solved
                    ? "Mark exam as unsolved"
                    : "Mark exam as solved"
                }
                icon={<IconPencilCheck />}
                onClick={(event: React.SyntheticEvent) => {
                  void handleToggleUserSolved(event, exam);
                }}
                variant={exam.user_solved ? "filled" : "transparent"}
              />
              {catAdmin &&
                (exam.finished_cuts ? (
                  <StatusIcon
                    tooltip="Admin actions all done"
                    icon={IconChecklist}
                    color="green"
                  />
                ) : (
                  <StatusIcon
                    tooltip="Admin must cut the exam"
                    icon={IconScissors}
                    color="orange"
                  />
                ))}
              {catAdmin &&
                (exam.public ? (
                  <StatusIcon tooltip="Exam is public" icon={IconWorld} />
                ) : (
                  <StatusIcon tooltip="Exam is hidden" icon={IconEyeOff} />
                ))}
              {user.isAdmin && (
                <IconButton
                  size="sm"
                  color="red"
                  tooltip="Delete exam"
                  icon={<IconTrash />}
                  variant="transparent"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                    handleRemoveClick(e, exam)
                  }
                />
              )}
            </Group>
          </Group>
        ))}
      </Box>
    </>
  );
};

export default ExamTypeSection;
