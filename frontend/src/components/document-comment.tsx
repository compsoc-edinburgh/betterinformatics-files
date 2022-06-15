import {
  Card,
  DeleteIcon,
  EditIcon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SaveIcon,
  Spinner,
} from "@vseth/components";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { imageHandler } from "../api/fetch-utils";
import {
  Mutate,
  useDeleteDocumentComment,
  useUpdateDocumentComment,
} from "../api/hooks";
import { useUser } from "../auth";
import { Document, DocumentComment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import SmallButton from "./small-button";
import TooltipButton from "./TooltipButton";

interface Props {
  documentAuthor: string;
  documentSlug: string;
  comment: DocumentComment;
  mutate: Mutate<Document>;
}
const DocumentCommentComponent = ({
  documentAuthor,
  documentSlug,
  comment,
  mutate,
}: Props) => {
  const { isAdmin } = useUser()!;
  const [editLoading, updateComment] = useUpdateDocumentComment(
    documentAuthor,
    documentSlug,
    comment.oid,
    (res) => {
      setHasDraft(false);
      mutate((document) => ({
        ...document,
        comments: document.comments.map((c) => (c.oid !== res.oid ? c : res)),
      }));
    },
  );
  const [loading, deleteComment] = useDeleteDocumentComment(
    documentAuthor,
    documentSlug,
    comment.oid,
    () =>
      mutate((document) => ({
        ...document,
        comments: document.comments.filter((c) => c.oid !== comment.oid),
      })),
  );
  const [hasDraft, setHasDraft] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const toggle = () => setHasDraft((e) => !e);
  return (
    <>
      <Modal toggle={toggle} isOpen={hasDraft} size="lg">
        <ModalHeader toggle={toggle}>Edit Comment</ModalHeader>
        <ModalBody>
          <Editor
            value={draftText}
            onChange={setDraftText}
            imageHandler={imageHandler}
            preview={(value) => <MarkdownText value={value} />}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
          />
        </ModalBody>
        <ModalFooter className="d-flex justify-content-end mt-2">
          <TooltipButton
            color="primary"
            disabled={editLoading || draftText.length === 0}
            onClick={() => updateComment(draftText)}
          >
            Save{" "}
            {editLoading ? (
              <Spinner className="ml-2" size="sm" />
            ) : (
              <SaveIcon className="ml-2" />
            )}
          </TooltipButton>
        </ModalFooter>
      </Modal>
      <Card className="my-3 pt-3" body>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <div>
            <Link to={`/user/${comment.authorId}`}>
              {comment.authorDisplayName}
              <span className="text-muted ml-2">@{comment.authorId}</span>
            </Link>
            <span className="text-muted mx-1">·</span>
            {comment && (
              <span className="text-muted" title={comment.time}>
                {formatDistanceToNow(new Date(comment.time))} ago
              </span>
            )}
            {comment &&
              differenceInSeconds(
                new Date(comment.edittime),
                new Date(comment.time),
              ) > 1 && (
                <>
                  <span className="text-muted mx-1">·</span>
                  <span className="text-muted" title={comment.edittime}>
                    edited {formatDistanceToNow(new Date(comment.edittime))} ago
                  </span>
                </>
              )}
          </div>
          <div>
            {(comment.canEdit || isAdmin) && (
              <SmallButton
                tooltip="Delete comment"
                size="sm"
                color="white"
                onClick={deleteComment}
              >
                <DeleteIcon size={18} />
              </SmallButton>
            )}

            {comment.canEdit && (
              <SmallButton
                tooltip="Edit comment"
                size="sm"
                color="white"
                onClick={() => {
                  toggle();
                  setDraftText(comment.text);
                  setUndoStack({
                    prev: [],
                    next: [],
                  });
                }}
              >
                <EditIcon size={18} />
              </SmallButton>
            )}
          </div>
        </div>
        <MarkdownText value={comment.text} />
      </Card>
    </>
  );
};

export default DocumentCommentComponent;
