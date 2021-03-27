import React, { useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";

interface Props {}
const SummaryCommentForm: React.FC<Props> = () => {
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
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
    </div>
  );
};

export default SummaryCommentForm;
