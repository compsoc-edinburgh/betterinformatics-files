import { differenceInSeconds } from "date-fns";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { addNewComment, removeComment, updateComment } from "../api/comment";
import { imageHandler } from "../api/fetch-utils";
import { useMutation, useResetExamCommentFlaggedVote, useResetExamCommentMarkedAsAi, useSetExamCommentFlagged, useSetExamCommentMarkedAsAi } from "../api/hooks";
import { useUser } from "../auth";
import useRemoveConfirm from "../hooks/useRemoveConfirm";
import { Answer, AnswerSection, Comment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import CodeBlock from "./code-block";
import MarkdownText from "./markdown-text";
import { useOfficialSolutionLanguage } from "./official-solution";
import { Anchor, Button, Flex, Group, Menu, Paper, Text } from "@mantine/core";
import {
  IconCode,
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconFlag,
  IconLink,
  IconPencilCancel,
  IconRobot,
  IconRobotOff,
  IconTrash,
} from "@tabler/icons-react";
import FlaggedBadge from "./FlaggedBadge";
import MarkedAsAiBadge from "./MarkedAsAiBadge";
import { useDisclosure } from "@mantine/hooks";
import TimeText from "./time-text";
import { copy } from "../utils/clipboard";

interface Props {
  answer: Answer;
  comment?: Comment;
  onSectionChanged: (newSection: AnswerSection) => void;
  onDelete?: () => void;
}
const CommentComponent: React.FC<Props> = ({
  answer,
  comment,
  onSectionChanged,
  onDelete,
}) => {
  const [setFlaggedLoading, setExamCommentFlagged] = useSetExamCommentFlagged(onSectionChanged);
  const [resetFlaggedLoading, resetExamCommentFlagged] = useResetExamCommentFlaggedVote(onSectionChanged);
  const [, setExamCommentMarkedAsAi] = useSetExamCommentMarkedAsAi(onSectionChanged);
  const [, resetExamCommentMarkedAsAi] = useResetExamCommentMarkedAsAi(onSectionChanged);
  const [viewSource, {toggle: toggleViewSource}] = useDisclosure();
  const { isAdmin, username } = useUser()!;
  const [removeConfirm, modals] = useRemoveConfirm();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const [addNewLoading, runAddNewComment] = useMutation(addNewComment, res => {
    if (onDelete) onDelete();
    onSectionChanged(res);
  });
  const [updateLoading, runUpdateComment] = useMutation(updateComment, res => {
    setEditing(false);
    onSectionChanged(res);
  });
  const [removeLoading, runRemoveComment] = useMutation(
    removeComment,
    onSectionChanged,
  );
  const loading = addNewLoading || updateLoading || removeLoading;
  const languages = useOfficialSolutionLanguage();

  const onSave = () => {
    if (comment === undefined) {
      runAddNewComment(answer.oid, draftText);
    } else {
      runUpdateComment(comment.oid, draftText);
    }
  };
  const onCancel = () => {
    if (comment === undefined) {
      if (onDelete) onDelete();
    } else {
      setEditing(false);
    }
  };
  const startEditing = () => {
    if (comment === undefined) return;
    setDraftText(comment.text);
    setEditing(true);
  };
  const remove = () => {
    if (comment)
      removeConfirm("Remove comment?", () => runRemoveComment(comment.oid));
  };
  const flaggedLoading = setFlaggedLoading || resetFlaggedLoading;

  return (
    <Paper
      radius={0}
      withBorder
      shadow="none"
      p="sm"
      style={{ marginBottom: "-1px" }}
      id={comment?.longId ?? ""}
    >
      {modals}
      <Flex justify="space-between">
        <div>
          <Anchor
            component={Link}
            to={`/user/${comment?.authorId ?? username}`}
          >
            <Text fw={700} component="span">
              {comment?.authorDisplayName ?? "(Draft)"}
            </Text>
            <Text ml="0.25em" c="dimmed" component="span">
              @{comment?.authorId ?? username}
            </Text>
          </Anchor>
          <Text component="span" mx={6} c="dimmed">
            ·
          </Text>
          {comment && (
            <TimeText time={comment.time} suffix="ago" />
          )}
          {comment &&
            differenceInSeconds(
              new Date(comment.edittime),
              new Date(comment.time),
            ) > 1 && (
              <>
                <Text component="span" mx={6} c="dimmed">
                  ·
                </Text>
                <TimeText time={comment.edittime} prefix="edited" suffix="ago" />
              </>
            )}
          {comment && <MarkedAsAiBadge count={comment.markedAsAiCount} />}
        </div>
        <Flex>
          {comment && (
            <FlaggedBadge
              count={comment.flaggedCount}
              isFlagged={comment.isFlagged}
              loading={flaggedLoading}
              size="xs"
              onToggle={() => setExamCommentFlagged(comment.oid, !comment.isFlagged)}
            />
          )}
          {comment && (
            <Menu withinPortal>
              <Menu.Target>
                <Button size="xs" variant="light" color="gray" mr="md"><IconDots/></Button>
              </Menu.Target>
              <Menu.Dropdown>
                {!comment.isMarkedAsAi ? (
                  <Menu.Item
                    leftSection={<IconRobot />}
                    onClick={() => setExamCommentMarkedAsAi(comment.oid, true)}
                  >
                    Mark as AI-generated
                  </Menu.Item>
                ) : (
                  <Menu.Item
                    leftSection={<IconRobotOff />}
                    onClick={() => setExamCommentMarkedAsAi(comment.oid, false)}
                  >
                    Remove AI-generated mark
                  </Menu.Item>
                )}
                {comment.flaggedCount === 0 && (
                  <Menu.Item
                    leftSection={<IconFlag />}
                    onClick={() => setExamCommentFlagged(comment.oid, true)}
                  >
                    Flag as Inappropriate
                  </Menu.Item>
                )}
                <Menu.Item
                        leftSection={<IconLink />}
                        onClick={() =>
                          copy(
                            `${document.location.origin}/exams/${answer.filename}?comment=${comment.longId}&answer=${answer.longId}`,
                          )
                        }
                      >
                        Copy Permalink
                </Menu.Item>
                {isAdmin && comment.markedAsAiCount > 0 && (
                  <Menu.Item
                    leftSection={<IconRobotOff />}
                    onClick={() => resetExamCommentMarkedAsAi(comment.oid)}
                  >
                    Remove all AI-generated marks
                  </Menu.Item>
                )}
                {isAdmin && comment.flaggedCount > 0 && (
                  <Menu.Item
                    leftSection={<IconFlag />}
                    onClick={() => resetExamCommentFlagged(comment.oid)}
                  >
                    Remove all inappropriate flags
                  </Menu.Item>
                )}
                {!editing && comment.canEdit && (
                  <Menu.Item
                    leftSection={<IconEdit />}
                    onClick={startEditing}
                  >
                    Edit
                  </Menu.Item>
                )}
                {comment && (comment.canEdit || isAdmin) && (
                  <Menu.Item leftSection={<IconTrash />} onClick={remove}>
                    Delete
                  </Menu.Item>
                )}
                {!editing && !comment.canEdit && (
                <Menu.Item
                  leftSection={<IconCode />}
                  onClick={toggleViewSource}
                >
                  Toggle Source Code Mode
                </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
          </Flex>
        </Flex>
      {comment === undefined || editing ? (
        <>
          <Editor
            value={draftText}
            onChange={setDraftText}
            imageHandler={imageHandler}
            preview={value => (
              <MarkdownText value={value} languages={languages} />
            )}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
          />
          <Group justify="flex-end" mt="sm">
            <Button
              size="sm"
              color="red"
              variant="subtle"
              onClick={onCancel}
              leftSection={<IconPencilCancel />}
            >
              {comment === undefined ? "Delete Draft" : "Cancel"}
            </Button>
            <Button
              size="sm"
              loading={loading}
              disabled={draftText.trim().length === 0}
              onClick={onSave}
              leftSection={<IconDeviceFloppy />}
            >
              Save
            </Button>
          </Group>
        </>
      ) : (
        <div>
          {viewSource ? (
            <CodeBlock value={comment.text} language="markdown" />
          ) : (
            <MarkdownText value={comment.text} languages={languages} />
          )}
        </div>
      )}
    </Paper>
  );
};

export default CommentComponent;
