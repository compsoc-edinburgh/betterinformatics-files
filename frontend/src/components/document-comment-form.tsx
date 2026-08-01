import { Flex, Loader } from "@mantine/core";
import React, { lazy, Suspense, useState } from "react";
import { usePendingImages } from "./Editor/pending-images";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import TooltipButton from "./TooltipButton";
import { useCreateDocumentComment } from "../api/hooks/documents";

const Editor = lazy(() => import("./Editor"));

interface Props {
  documentSlug: string;
  refetch: () => void;
}
const DocumentCommentForm: React.FC<Props> = ({ documentSlug, refetch }) => {
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const { deferredImageHandler, flushPendingImages, pendingObjectUrls } =
    usePendingImages();

  const createDocumentComment = useCreateDocumentComment({
    mutation: {
      onSuccess() {
        refetch();
        setDraftText("");
        setUndoStack({
          prev: [],
          next: [],
        });
      },
    },
  });

  return (
    <Suspense fallback={<Loader />}>
      <Editor
        value={draftText}
        onChange={setDraftText}
        imageHandler={deferredImageHandler}
        preview={value => (
          <MarkdownText value={value} pendingImages={pendingObjectUrls} />
        )}
        undoStack={undoStack}
        setUndoStack={setUndoStack}
      />
      <Flex justify="end" mt="xs">
        <TooltipButton
          size="md"
          tooltip="Submit comment"
          disabled={createDocumentComment.isPending || draftText.length === 0}
          onClick={async () => {
            const text = await flushPendingImages(draftText);
            createDocumentComment.mutate({
              slug: documentSlug,
              data: {
                text,
              },
            });
          }}
        >
          Submit
        </TooltipButton>
      </Flex>
    </Suspense>
  );
};

export default DocumentCommentForm;
