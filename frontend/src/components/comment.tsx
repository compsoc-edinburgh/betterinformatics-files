import { useRequest } from "@umijs/hooks";
import {
  Button,
  ListGroupItem,
  Spinner,
  ICONS,
  Icon,
  ButtonGroup,
} from "@vseth/components";
import React, { useState } from "react";
import { fetchpost, imageHandler } from "../api/fetch-utils";
import { Answer, AnswerSection, Comment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import TwoButtons from "./two-buttons";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import IconButton from "./icon-button";

const addNewComment = async (answerId: string, text: string) => {
  return (
    await fetchpost(`/api/exam/addcomment/${answerId}/`, {
      text,
    })
  ).value as AnswerSection;
};
const updateComment = async (commentId: string, text: string) => {
  return (
    await fetchpost(`/api/exam/setcomment/${commentId}/`, {
      text,
    })
  ).value as AnswerSection;
};
const removeComment = async (commentId: string) => {
  return (await fetchpost(`/api/exam/removecomment/${commentId}/`, {}))
    .value as AnswerSection;
};

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
  const { isAdmin } = useUser()!;
  const [confirm, modals] = useConfirm();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const { loading: addNewLoading, run: runAddNewComment } = useRequest(
    addNewComment,
    {
      manual: true,
      onSuccess: res => {
        if (onDelete) onDelete();
        onSectionChanged(res);
      },
    },
  );
  const { loading: updateLoading, run: runUpdateComment } = useRequest(
    updateComment,
    {
      manual: true,
      onSuccess: res => {
        setEditing(false);
        onSectionChanged(res);
      },
    },
  );
  const { loading: removeLoading, run: runRemoveComment } = useRequest(
    removeComment,
    {
      manual: true,
      onSuccess: onSectionChanged,
    },
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
    <ListGroupItem>
      {modals}
      <div style={{ position: "absolute", top: 0, right: 0 }}>
        <ButtonGroup>
          {!editing && comment?.canEdit && (
            <Button
              size="sm"
              color="white"
              style={{ minWidth: 0 }}
              onClick={startEditing}
            >
              <Icon icon={ICONS.EDIT} size={18} />
            </Button>
          )}
          {comment && (comment.canEdit || isAdmin) && (
            <Button
              size="sm"
              color="white"
              style={{ minWidth: 0 }}
              onClick={remove}
            >
              <Icon icon={ICONS.DELETE} size={18} />
            </Button>
          )}
        </ButtonGroup>
      </div>

      <h6>{comment?.authorDisplayName ?? "(Draft)"}</h6>
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
          <TwoButtons
            left={
              <IconButton
                size="sm"
                color="primary"
                disabled={loading}
                onClick={onSave}
                icon="SAVE"
              >
                {loading ? <Spinner /> : "Save"}
              </IconButton>
            }
            right={
              <IconButton size="sm" onClick={onCancel} icon="CLOSE">
                {comment === undefined ? "Delete Draft" : "Cancel"}
              </IconButton>
            }
          />
        </>
      ) : (
        <MarkdownText value={comment.text} />
      )}
    </ListGroupItem>
  );
};

export default CommentComponent;
