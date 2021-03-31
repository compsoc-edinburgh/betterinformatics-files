import { useRequest } from "@umijs/hooks";
import { Button } from "@vseth/components";
import React, { useState } from "react";
import { imageHandler, NamedBlob } from "../api/fetch-utils";
import { useUpdateSummary } from "../api/hooks";
import { Summary } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";

interface Props {
  url: string;
  summary: Summary;
}
const SummaryMarkdownEditor: React.FC<Props> = ({ url, summary }) => {
  const [draftText, setDraftText] = useState("");
  const { error: mdError, loading: mdLoading, data } = useRequest(
    () => fetch(url).then(r => r.text()),
    { onSuccess: text => setDraftText(text) },
  );
  const [, updateSummary] = useUpdateSummary(
    summary.author,
    summary.slug,
    () => void 0,
  );
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  return (
    <div>
      {" "}
      <div className="form-group">
        <Editor
          value={draftText}
          onChange={setDraftText}
          imageHandler={imageHandler}
          preview={value => <MarkdownText value={value} />}
          undoStack={undoStack}
          setUndoStack={setUndoStack}
        />
      </div>
      <div className="form-group d-flex justify-content-end">
        <Button
          onClick={() =>
            updateSummary({
              file: new NamedBlob(new Blob([draftText]), "file.md"),
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default SummaryMarkdownEditor;
