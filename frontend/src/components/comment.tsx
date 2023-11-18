import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { addNewComment, removeComment, updateComment } from "../api/comment";
import { imageHandler } from "../api/fetch-utils";
import { useMutation } from "../api/hooks";
import useToggle from "../hooks/useToggle";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { Answer, AnswerSection, Comment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import CodeBlock from "./code-block";
import MarkdownText from "./markdown-text";
import SmallButton from "./small-button";
import { Icon, ICONS } from "vseth-canine-ui";
import { Anchor, Button, Flex, Paper, Text } from "@mantine/core";

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
  const [viewSource, toggleViewSource] = useToggle(false);
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
    <Paper radius={0} withBorder p="sm">
      {modals}
      <Flex justify="space-between">
        <div>
          <Anchor
            component={Link}
            to={`/user/${comment?.authorId ?? username}`}
          >
            <Text weight={700} component="span">
              {comment?.authorDisplayName ?? "(Draft)"}
            </Text>
            <Text ml="0.25em" color="dimmed" component="span">
              @{comment?.authorId ?? username}
            </Text>
          </Anchor>
          <Text component="span" mx="xs" color="dimmed">
            ·
          </Text>
          {comment && (
            <Text component="span" color="dimmed" title={comment.time}>
              {formatDistanceToNow(new Date(comment.time))} ago
            </Text>
          )}
          {comment &&
            differenceInSeconds(
              new Date(comment.edittime),
              new Date(comment.time),
            ) > 1 && (
              <>
                <span>·</span>
                <span title={comment.edittime}>
                  edited {formatDistanceToNow(new Date(comment.edittime))} ago
                </span>
              </>
            )}
        </div>
        {comment && !editing && comment.canEdit && (
          <Button.Group>
            <SmallButton
              tooltip="Edit comment"
              size="sm"
              color="white"
              onClick={startEditing}
            >
              <Icon icon={ICONS.EDIT} size={18} />
            </SmallButton>
            {(comment.canEdit || isAdmin) && (
              <SmallButton
                tooltip="Delete comment"
                size="sm"
                color="white"
                onClick={remove}
              >
                <Icon icon={ICONS.DELETE} size={18} />
              </SmallButton>
            )}
            <SmallButton
              tooltip="Toggle Source Code Mode"
              size="sm"
              color="white"
              onClick={toggleViewSource}
            >
              <Icon icon={ICONS.CODE} size={18} />
            </SmallButton>
          </Button.Group>
        )}
        {comment && !editing && !comment.canEdit && (
          <SmallButton
            tooltip="Toggle Source Code Mode"
            size="sm"
            color="white"
            onClick={toggleViewSource}
          >
            <Icon icon={ICONS.CODE} size={18} />
          </SmallButton>
        )}
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
          <Flex justify="space-between" mt="sm">
            <Button
              size="sm"
              variant="brand"
              loading={loading}
              disabled={draftText.trim().length === 0}
              onClick={onSave}
              leftIcon={<Icon icon={ICONS.SAVE} />}
            >
              Save
            </Button>
            <Button
              size="sm"
              onClick={onCancel}
              leftIcon={<Icon icon={ICONS.CLOSE} />}
            >
              {comment === undefined ? "Delete Draft" : "Cancel"}
            </Button>
          </Flex>
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
