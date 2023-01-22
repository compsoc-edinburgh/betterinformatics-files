import { Loader } from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import { Button } from "@vseth/components";
import React, { useState } from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { imageHandler, NamedBlob } from "../api/fetch-utils";
import { useUpdateDocumentFile } from "../api/hooks";
import { Document, DocumentFile } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";

interface Props {
  document: Document;
  file: DocumentFile;
  url: string;
}
const DocumentMarkdownEditor: React.FC<Props> = ({ document, file, url }) => {
  const [draftText, setDraftText] = useState("");
  useRequest(() => fetch(url).then(r => r.text()), {
    onSuccess: text => setDraftText(text),
  });
  const [loading, updateDocument] = useUpdateDocumentFile(
    document.author,
    document.slug,
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
            updateDocument({
              file: new NamedBlob(new Blob([draftText]), "file.md"),
            })
          }
        >
          {loading ? (
            <Loader size="sm" className="mr-2" />
          ) : (
            <Icon icon={ICONS.SAVE} className="mr-2" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
};

export default DocumentMarkdownEditor;
