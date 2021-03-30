import { Button } from "@vseth/components";
import React, { useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import { useCreateSummary, useCreateSummaryComment, Mutate } from "../api/hooks";
import { Summary, SummaryComment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";

interface Props {
  summarySlug: string;
  mutate: Mutate<Summary>;
}
const SummaryCommentForm: React.FC<Props> = ({ summarySlug, mutate }) => {
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const [loading, createSummaryComment] = useCreateSummaryComment(
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
      <Button onClick={() => createSummaryComment(draftText)}>Submit</Button>
    </div>
  );
};

export default SummaryCommentForm;
