import { differenceInSeconds } from "date-fns";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { addNewComment, removeComment, updateComment } from "../api/comment";
import { imageHandler } from "../api/fetch-utils";
import { useMutation, useResetExamCommentFlaggedVote, useSetExamCommentFlagged } from "../api/hooks";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { Answer, AnswerSection, Comment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import CodeBlock from "./code-block";
import MarkdownText from "./markdown-text";
import SmallButton from "./small-button";
import { Anchor, Button, Flex, Group, Menu, Paper, Text } from "@mantine/core";
import {
  IconChevronUp,
  IconCode,
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconFlag,
  IconLink,
  IconPencilCancel,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import TooltipButton from "./TooltipButton";
import TimeText from "./time-text";
import displayNameClasses from "../utils/display-name.module.css";
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
  const [viewSource, { toggle: toggleViewSource }] = useDisclosure();
  const { isAdmin, username } = useUser()!;
  const [confirm, modals] = useConfirm();
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
      confirm("Remove comment?", () => runRemoveComment(comment.oid));
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
        <Group gap={0}>
          <Anchor
            component={Link}
            to={`/user/${comment?.authorId ?? username}`}
            className={displayNameClasses.shrinkableDisplayName}
          >
            <Text fw={700} component="span">
              {comment?.authorDisplayName ?? "(Draft)"}
            </Text>
            <Text ml="0.25em" color="dimmed" component="span">
              @{comment?.authorId ?? username}
            </Text>
          </Anchor>
          <Text component="span" mx={6} color="dimmed">
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
                <Text component="span" mx={6} color="dimmed">
                  ·
                </Text>
                <TimeText time={comment.edittime} prefix="edited" suffix="ago" />
              </>
            )}
        </Group>
        <Flex>
          {comment &&
            (comment.isFlagged ||
              (comment.flaggedCount > 0 && isAdmin) ||
              flaggedLoading) && (
              <Paper shadow="xs" mr="md">
                <Button.Group>
                  <TooltipButton
                    tooltip="Flagged as Inappropriate"
                    color="red"
                    px={12}
                    variant="filled"
                    size="xs"
                  >
                    <IconFlag />
                  </TooltipButton>
                  <TooltipButton
                    color="red"
                    miw={30}
                    tooltip={`${comment.flaggedCount} users consider this answer inappropriate.`}
                    size="xs"
                  >
                    {comment.flaggedCount}
                  </TooltipButton>
                  <TooltipButton
                    px={8}
                    tooltip={
                      comment.isFlagged
                        ? "Remove inappropriate flag"
                        : "Add inappropriate flag"
                    }
                    size="xs"
                    loading={flaggedLoading}
                    style={{ borderLeftWidth: 0 }}
                    onClick={() =>
                      setExamCommentFlagged(comment.oid, !comment.isFlagged)
                    }
                  >
                    {comment.isFlagged ? <IconX /> : <IconChevronUp />}
                  </TooltipButton>
                </Button.Group>
              </Paper>
            )}
          {comment && (
            <Menu withinPortal>
              <Menu.Target>
                <Button size="xs" variant="light" color="gray" mr="md"><IconDots/></Button>
              </Menu.Target>
              <Menu.Dropdown>
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
            preview={value => <MarkdownText value={value} />}
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
            <MarkdownText value={comment.text} />
          )}
        </div>
      )}
    </Paper>
  );
};

export default CommentComponent;
