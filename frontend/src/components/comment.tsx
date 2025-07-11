import { differenceInSeconds } from "date-fns";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { addNewComment, removeComment, updateComment } from "../api/comment";
import { imageHandler } from "../api/fetch-utils";
import { useMutation } from "../api/hooks";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { Answer, AnswerSection, Comment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import CodeBlock from "./code-block";
import MarkdownText from "./markdown-text";
import { Anchor, Button, Group, Paper, Text } from "@mantine/core";
import {
  IconCode,
  IconDeviceFloppy,
  IconEdit,
  IconPencilCancel,
  IconTrash,
} from "@tabler/icons-react";
import IconButton from "./icon-button";
import { useDisclosure } from "@mantine/hooks";
import TimeText from "./time-text";
import displayNameClasses from "../utils/display-name.module.css";

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
  return (
    <Paper
      radius={0}
      withBorder
      shadow="none"
      p="sm"
      style={{ marginBottom: "-1px" }}
    >
      {modals}
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
        {comment && !editing && comment.canEdit && (
          <Button.Group ml="auto">
            <IconButton
              tooltip="Edit comment"
              color="gray"
              mr="4px"
              onClick={startEditing}
              icon={<IconEdit />}
            />
            {(comment.canEdit || isAdmin) && (
              <IconButton
                tooltip="Delete comment"
                color="red"
                mr="4px"
                onClick={remove}
                icon={<IconTrash />}
              />
            )}
            <IconButton
              tooltip="Toggle Source Code Mode"
              color="gray"
              onClick={toggleViewSource}
              icon={<IconCode />}
            >
              <IconCode />
            </IconButton>
          </Button.Group>
        )}
        {comment && !editing && !comment.canEdit && (
          <IconButton
            ml="auto"
            tooltip="Toggle Source Code Mode"
            color="gray"
            onClick={toggleViewSource}
            icon={<IconCode />}
          />
        )}
      </Group>

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
