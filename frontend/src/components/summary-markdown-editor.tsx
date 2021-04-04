import { useRequest } from "@umijs/hooks";
import { Button, SaveIcon, Spinner } from "@vseth/components";
import React, { useState } from "react";
import { imageHandler, NamedBlob } from "../api/fetch-utils";
import { useUpdateSummaryFile } from "../api/hooks";
import { Summary, SummaryFile } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";

interface Props {
  summary: Summary;
  file: SummaryFile;
  url: string;
}
const SummaryMarkdownEditor: React.FC<Props> = ({ summary, file, url }) => {
  const [draftText, setDraftText] = useState("");
  useRequest(() => fetch(url).then(r => r.text()), {
    onSuccess: text => setDraftText(text),
  });
  const [loading, updateSummary] = useUpdateSummaryFile(
    summary.author,
    summary.slug,
    file.oid,
  );
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  return (
    <div>
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
          {loading ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <SaveIcon className="mr-2" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
};

export default SummaryMarkdownEditor;
