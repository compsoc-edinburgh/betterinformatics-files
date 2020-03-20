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
import { fetchpost, imageHandler } from "../fetch-utils";
import { Answer, AnswerSection, Comment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import TwoButtons from "./two-buttons";
import { useUser } from "../auth";

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

interface Props {
  section: AnswerSection;
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
  const loading = addNewLoading || updateLoading;

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

  return (
    <ListGroupItem>
      <div
        style={{ position: "absolute", top: 0, right: 0 }}
        onClick={startEditing}
      >
        <ButtonGroup>
          {!editing && comment?.canEdit && (
            <Button size="sm" color="white" style={{ minWidth: 0 }}>
              <Icon icon={ICONS.EDIT} size={18} />
            </Button>
          )}
          {comment && (comment.canEdit || isAdmin) && (
            <Button size="sm" color="white" style={{ minWidth: 0 }}>
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
              <Button
                size="sm"
                color="primary"
                disabled={loading}
                onClick={onSave}
              >
                {loading ? <Spinner /> : "Save"}
              </Button>
            }
            right={
              <Button size="sm" onClick={onCancel}>
                {comment === undefined ? "Delete Draft" : "Cancel"}
              </Button>
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
