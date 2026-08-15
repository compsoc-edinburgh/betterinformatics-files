import { Button, Loader } from "@mantine/core";
import React, { lazy, Suspense, useRef, useState } from "react";
import { usePendingImages } from "./Editor/pending-images";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import { IconDeviceFloppy } from "@tabler/icons-react";
import type { DocumentFileSchema } from "../api/model/documentFileSchema";
import {
  getGetDocumentFileQueryKey,
  useUpdateDocumentFile,
} from "../api/hooks/documents";
import type { DocumentSchema } from "../api/model/documentSchema";
import { useQuery } from "@tanstack/react-query";

const Editor = lazy(() => import("./Editor"));

interface Props {
  document: DocumentSchema;
  file: DocumentFileSchema;
  url: string;
}
const DocumentMarkdownEditor: React.FC<Props> = ({ document, file, url }) => {
  const [draftText, setDraftText] = useState<string | undefined>(undefined);

  // This avoids refetching the body every time
  // Further, it avoids a quick flash of stale data
  // if we were to refetch the data.
  const fileCache = useRef<Record<string, string>>({});

  const { mutate, isPending } = useUpdateDocumentFile();
  const { data: initialBody } = useQuery({
    queryKey: getGetDocumentFileQueryKey(document.slug, file.filename),
    // bypass fetch-utils as that can only handle json
    async queryFn() {
      if (Object.hasOwn(fileCache.current, file.filename)) {
        return fileCache.current[file.filename];
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Downloading markdown body failed.");
      }

      return response.text();
    },
  });
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const { deferredImageHandler, flushPendingImages, pendingObjectUrls } =
    usePendingImages();
  return (
    <Suspense fallback={<Loader />}>
      <Editor
        value={draftText ?? initialBody ?? ""}
        onChange={setDraftText}
        imageHandler={deferredImageHandler}
        preview={value => (
          <MarkdownText value={value} pendingImages={pendingObjectUrls} />
        )}
        undoStack={undoStack}
        setUndoStack={setUndoStack}
      />
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={async () => {
          // The user didn't modify the file
          // so we don't need to save it again
          if (draftText === undefined) return;

          const finalText = await flushPendingImages(draftText);
          mutate({
            slug: document.slug,
            id: file.oid,
            data: {
              file: new File([finalText], "file.md", { type: "text/markdown" }),
            },
          });
          fileCache.current[file.filename] = finalText;
        }}
        loading={isPending}
        leftSection={<IconDeviceFloppy />}
      >
        Save
      </Button>
    </Suspense>
  );
};

export default DocumentMarkdownEditor;
