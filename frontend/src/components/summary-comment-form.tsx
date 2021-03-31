import { SendIcon, Spinner } from "@vseth/components";
import React, { useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import { Mutate, useCreateSummaryComment } from "../api/hooks";
import { Summary } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import TooltipButton from "./TooltipButton";

interface Props {
  summaryAuthor: string;
  summarySlug: string;
  mutate: Mutate<Summary>;
}
const SummaryCommentForm: React.FC<Props> = ({
  summaryAuthor,
  summarySlug,
  mutate,
}) => {
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const [loading, createSummaryComment] = useCreateSummaryComment(
    summaryAuthor,
    summarySlug,
    summary => {
      mutate(data => ({ ...data, comments: [...data.comments, summary] }));
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
          onClick={() => createSummaryComment(draftText)}
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

export default SummaryCommentForm;
