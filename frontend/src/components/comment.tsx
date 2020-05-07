import {
  ButtonGroup,
  Icon,
  ICONS,
  ListGroupItem,
  Spinner,
  Row,
  Col,
} from "@vseth/components";
import React, { useState } from "react";
import { addNewComment, removeComment, updateComment } from "../api/comment";
import { imageHandler } from "../api/fetch-utils";
import { useMutation } from "../api/hooks";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { Answer, AnswerSection, Comment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";
import SmallButton from "./small-button";

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
    <ListGroupItem>
      {modals}
      <div className="position-absolute position-top-right">
        <ButtonGroup>
          {!editing && comment?.canEdit && (
            <SmallButton
              tooltip="Edit comment"
              size="sm"
              color="white"
              onClick={startEditing}
            >
              <Icon icon={ICONS.EDIT} size={18} />
            </SmallButton>
          )}
          {comment && (comment.canEdit || isAdmin) && (
            <SmallButton
              tooltip="Delete comment"
              size="sm"
              color="white"
              onClick={remove}
            >
              <Icon icon={ICONS.DELETE} size={18} />
            </SmallButton>
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
          <Row className="flex-between">
            <Col xs="auto">
              <IconButton
                className="m-1"
                size="sm"
                color="primary"
                disabled={loading}
                onClick={onSave}
                icon="SAVE"
              >
                {loading ? <Spinner /> : "Save"}
              </IconButton>
            </Col>
            <Col xs="auto">
              <IconButton
                className="m-1"
                size="sm"
                onClick={onCancel}
                icon="CLOSE"
              >
                {comment === undefined ? "Delete Draft" : "Cancel"}
              </IconButton>
            </Col>
          </Row>
        </>
      ) : (
        <MarkdownText value={comment.text} />
      )}
    </ListGroupItem>
  );
};

export default CommentComponent;
