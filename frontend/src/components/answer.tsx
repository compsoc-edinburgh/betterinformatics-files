import {
  Button,
  Card,
  Flex,
  Group,
  GroupProps,
  Text,
  Menu,
  Anchor,
  Box,
  Paper,
} from "@mantine/core";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { imageHandler } from "../api/fetch-utils";
import {
  useRemoveAnswer,
  useResetFlaggedVote,
  useSetExpertVote,
  useSetFlagged,
  useUpdateAnswer,
} from "../api/hooks";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { Answer, AnswerSection } from "../interfaces";
import { copy } from "../utils/clipboard";
import CodeBlock from "./code-block";
import CommentSectionComponent from "./comment-section";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import Score from "./score";
import TooltipButton from "./TooltipButton";
import {
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconFlag,
  IconLink,
  IconPencilCancel,
  IconPlus,
  IconStarFilled,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import classes from "./answer.module.css";
import { useDisclosure } from "@mantine/hooks";

const AnswerToolbar = (props: GroupProps) => (
  <Group className={classes.answerToolbarStyle} {...props} />
);

interface Props {
  section?: AnswerSection;
  answer?: Answer;
  onSectionChanged?: (newSection: AnswerSection) => void;
  onDelete?: () => void;
  isLegacyAnswer: boolean;
  hasId?: boolean;
}
const AnswerComponent: React.FC<Props> = ({
  section,
  answer,
  onDelete,
  onSectionChanged,
  isLegacyAnswer,
  hasId = true,
}) => {
  const [viewSource, {toggle: toggleViewSource}] = useDisclosure();
  const [setFlaggedLoading, setFlagged] = useSetFlagged(onSectionChanged);
  const [resetFlaggedLoading, resetFlagged] =
    useResetFlaggedVote(onSectionChanged);
  const [setExpertVoteLoading, setExpertVote] =
    useSetExpertVote(onSectionChanged);
  const removeAnswer = useRemoveAnswer(onSectionChanged);
  const [updating, update] = useUpdateAnswer(res => {
    setEditing(false);
    if (onSectionChanged) onSectionChanged(res);
    if (answer === undefined && onDelete) onDelete();
  });
  const { isAdmin, isExpert } = useUser()!;
  const [confirm, modals] = useConfirm();
  const [editing, setEditing] = useState(false);

  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const startEdit = useCallback(() => {
    setDraftText(answer?.text ?? "");
    setEditing(true);
  }, [answer]);
  const onCancel = useCallback(() => {
    setEditing(false);
    if (answer === undefined && onDelete) onDelete();
  }, [onDelete, answer]);
  const save = useCallback(() => {
    if (section) update(section.oid, draftText, isLegacyAnswer);
  }, [section, draftText, update, isLegacyAnswer]);
  const remove = useCallback(() => {
    if (answer) confirm("Remove answer?", () => removeAnswer(answer.oid));
  }, [confirm, removeAnswer, answer]);
  const [hasCommentDraft, setHasCommentDraft] = useState(false);

  const flaggedLoading = setFlaggedLoading || resetFlaggedLoading;
  const canEdit = section && onSectionChanged && (answer?.canEdit || false);
  const canRemove =
    section && onSectionChanged && (isAdmin || answer?.canEdit || false);
  const { username } = useUser()!;
  return (
    <>
      {modals}
      <Card
        mb="md"
        shadow="md"
        id={hasId ? answer?.longId : undefined}
        className={classes.answerWrapperStyle}
      >
        <Card.Section px="md" py="md" withBorder>
          <Flex justify="space-between" align="center">
            <div>
              {!hasId && (
                <Link
                  to={
                    answer ? `/exams/${answer.filename}#${answer.longId}` : ""
                  }
                >
                  <Text mr={8} component="span">
                    <IconLink style={{ height: "13px", width: "13px" }} />
                  </Text>
                </Link>
              )}
              {isLegacyAnswer ? (
                answer?.authorDisplayName ?? "(Legacy Draft)"
              ) : (
                <Anchor
                  component={Link}
                  to={`/user/${answer?.authorId ?? username}`}
                >
                  <Text fw={700} component="span">
                    {answer?.authorDisplayName ?? "(Draft)"}
                  </Text>
                  <Text ml="0.3em" c="dimmed" component="span">
                    @{answer?.authorId ?? username}
                  </Text>
                </Anchor>
              )}
              <Text c="dimmed" mx={6} component="span">
                ·
              </Text>
              {answer && (
                <Text c="dimmed" component="span" title={answer.time}>
                  {formatDistanceToNow(new Date(answer.time))} ago
                </Text>
              )}
              {answer &&
                differenceInSeconds(
                  new Date(answer.edittime),
                  new Date(answer.time),
                ) > 1 && (
                  <>
                    <Text color="dimmed" mx={6} component="span">
                      ·
                    </Text>
                    <Text
                      color="dimmed"
                      component="span"
                      title={answer.edittime}
                    >
                      edited {formatDistanceToNow(new Date(answer.edittime))}{" "}
                      ago
                    </Text>
                  </>
                )}
            </div>
            <Flex>
              <AnswerToolbar>
                {answer &&
                  (answer.expertvotes > 0 ||
                    setExpertVoteLoading ||
                    isExpert) && (
                    <Paper shadow="xs">
                      <Button.Group>
                        <TooltipButton
                          px={12}
                          tooltip="This answer is endorsed by an expert"
                          variant="filled"
                          color="yellow"
                        >
                          <IconStarFilled />
                        </TooltipButton>
                        <TooltipButton
                          miw={30}
                          tooltip={`${answer.expertvotes} experts endorse this answer.`}
                          loading={setExpertVoteLoading}
                        >
                          {answer.expertvotes}
                        </TooltipButton>
                        {isExpert && (
                          <TooltipButton
                            size="sm"
                            px={8}
                            tooltip={
                              answer.isExpertVoted
                                ? "Remove expert vote"
                                : "Add expert vote"
                            }
                            style={{ borderLeftWidth: 0 }}
                            onClick={() =>
                              setExpertVote(answer.oid, !answer.isExpertVoted)
                            }
                          >
                            {answer.isExpertVoted ? (
                              <IconChevronDown />
                            ) : (
                              <IconChevronUp />
                            )}
                          </TooltipButton>
                        )}
                      </Button.Group>
                    </Paper>
                  )}
                {answer &&
                  (answer.isFlagged ||
                    (answer.flagged > 0 && isAdmin) ||
                    flaggedLoading) && (
                    <Paper shadow="xs">
                      <Button.Group>
                        <TooltipButton
                          tooltip="Flagged as Inappropriate"
                          color="red"
                          px={12}
                          variant="filled"
                        >
                          <IconFlag />
                        </TooltipButton>
                        <TooltipButton
                          color="red"
                          miw={30}
                          tooltip={`${answer.flagged} users consider this answer inappropriate.`}
                        >
                          {answer.flagged}
                        </TooltipButton>
                        <TooltipButton
                          px={8}
                          tooltip={
                            answer.isFlagged
                              ? "Remove inappropriate flag"
                              : "Add inappropriate flag"
                          }
                          size="sm"
                          loading={flaggedLoading}
                          style={{ borderLeftWidth: 0 }}
                          onClick={() =>
                            setFlagged(answer.oid, !answer.isFlagged)
                          }
                        >
                          {answer.isFlagged ? <IconX /> : <IconChevronUp />}
                        </TooltipButton>
                      </Button.Group>
                    </Paper>
                  )}
                {answer && onSectionChanged && (
                  <Score
                    oid={answer.oid}
                    upvotes={answer.upvotes}
                    expertUpvotes={answer.expertvotes}
                    userVote={
                      answer.isUpvoted ? 1 : answer.isDownvoted ? -1 : 0
                    }
                    onSectionChanged={onSectionChanged}
                  />
                )}
              </AnswerToolbar>
            </Flex>
          </Flex>
        </Card.Section>
        {editing || answer === undefined ? (
          <Card.Section>
            <Box p="md">
              <Editor
                value={draftText}
                onChange={setDraftText}
                imageHandler={imageHandler}
                preview={value => <MarkdownText value={value} />}
                undoStack={undoStack}
                setUndoStack={setUndoStack}
              />
              <Text mt="xs" color="dimmed">
                Your answer will be licensed as{" "}
                <Anchor
                  c="blue"
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                  target="_blank"
                >
                  CC BY-NC-SA 4.0
                </Anchor>
                .
              </Text>
            </Box>
          </Card.Section>
        ) : (
          <Card.Section>
            <Box p="md">
              {viewSource ? (
                <CodeBlock value={answer?.text ?? ""} language="markdown" />
              ) : (
                <MarkdownText value={answer?.text ?? ""} />
              )}
            </Box>
          </Card.Section>
        )}
        <Group justify="right">
          {(answer === undefined || editing) && (
            <Button
              size="sm"
              onClick={save}
              loading={updating}
              disabled={draftText.trim().length === 0}
              leftSection={<IconDeviceFloppy />}
            >
              Save
            </Button>
          )}
          {onSectionChanged && (
            <Flex align="center">
              {(answer === undefined || editing) && (
                <Button
                  size="sm"
                  color="red"
                  onClick={onCancel}
                  leftSection={<IconPencilCancel />}
                >
                  {editing ? "Cancel" : "Delete Draft"}
                </Button>
              )}
              <Button.Group ml="md">
                {answer !== undefined && (
                  <Button
                    size="sm"
                    onClick={() => setHasCommentDraft(true)}
                    leftSection={<IconPlus />}
                    disabled={hasCommentDraft}
                  >
                    Add Comment
                  </Button>
                )}
                {answer !== undefined && (
                  <Menu withinPortal>
                    <Menu.Target>
                      <Button leftSection={<IconDots />}>More</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {answer.flagged === 0 && (
                        <Menu.Item
                          leftSection={<IconFlag />}
                          onClick={() => setFlagged(answer.oid, true)}
                        >
                          Flag as Inappropriate
                        </Menu.Item>
                      )}
                      <Menu.Item
                        leftSection={<IconLink />}
                        onClick={() =>
                          copy(
                            `${document.location.origin}/exams/${answer.filename}#${answer.longId}`,
                          )
                        }
                      >
                        Copy Permalink
                      </Menu.Item>
                      {isAdmin && answer.flagged > 0 && (
                        <Menu.Item
                          leftSection={<IconFlag />}
                          onClick={() => resetFlagged(answer.oid)}
                        >
                          Remove all inappropriate flags
                        </Menu.Item>
                      )}
                      {!editing && canEdit && (
                        <Menu.Item
                          leftSection={<IconEdit />}
                          onClick={startEdit}
                        >
                          Edit
                        </Menu.Item>
                      )}
                      {answer && canRemove && (
                        <Menu.Item leftSection={<IconTrash />} onClick={remove}>
                          Delete
                        </Menu.Item>
                      )}
                      <Menu.Item
                        leftSection={<IconCode />}
                        onClick={toggleViewSource}
                      >
                        Toggle Source Code Mode
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Button.Group>
            </Flex>
          )}
        </Group>

        {answer &&
          onSectionChanged &&
          (hasCommentDraft || answer.comments.length > 0) && (
            <CommentSectionComponent
              hasDraft={hasCommentDraft}
              answer={answer}
              onSectionChanged={onSectionChanged}
              onDraftDelete={() => setHasCommentDraft(false)}
            />
          )}
      </Card>
    </>
  );
};

export default AnswerComponent;
