import { SendIcon, Spinner } from "@vseth/components";
import React, { useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import { Mutate, useCreateDocumentComment } from "../api/hooks";
import { Document } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import TooltipButton from "./TooltipButton";

interface Props {
  documentAuthor: string;
  documentSlug: string;
  mutate: Mutate<Document>;
}
const DocumentCommentForm: React.FC<Props> = ({
  documentAuthor,
  documentSlug,
  mutate,
}) => {
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const [loading, createDocumentComment] = useCreateDocumentComment(
    documentAuthor,
    documentSlug,
    document => {
      mutate(data => ({ ...data, comments: [...data.comments, document] }));
      setDraftText("");
      setUndoStack({
        prev: [],
        next: [],
      });
    },
  );

  return (
    <div>
      <Editor
        value={draftText}
        onChange={setDraftText}
        imageHandler={imageHandler}
        preview={value => <MarkdownText value={value} />}
        undoStack={undoStack}
        setUndoStack={setUndoStack}
      />
      <div className="d-flex justify-content-end mt-2">
        <TooltipButton
          color="primary"
          disabled={loading || draftText.length === 0}
          onClick={() => createDocumentComment(draftText)}
        >
          Submit{" "}
          {loading ? (
            <Spinner className="ml-2" size="sm" />
          ) : (
            <SendIcon className="ml-2" />
          )}
        </TooltipButton>
      </div>
    </div>
  );
};

export default DocumentCommentForm;
