import {
  Button,
  Card,
  Flex,
  Group,
  Loader,
  TextInput,
  Title,
} from "@mantine/core";
import React, { lazy, Suspense, useCallback, useState } from "react";
import { usePendingImages } from "./Editor/pending-images";
import { useUser } from "../auth";
import useRemoveConfirm from "../hooks/useRemoveConfirm";
import { FAQEntry } from "../interfaces";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";
import {
  IconArrowDown,
  IconArrowUp,
  IconDeviceFloppy,
  IconEdit,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

const Editor = lazy(() => import("./Editor"));

interface Props {
  isAdmin?: boolean;
  entry: FAQEntry;
  prevEntry?: FAQEntry;
  nextEntry?: FAQEntry;
  onUpdate: (changes: Partial<FAQEntry>) => void;
  onSwap: (me: FAQEntry, other: FAQEntry) => void;
  onRemove: () => void;
}
const FAQEntryComponent: React.FC<Props> = ({
  entry,
  onUpdate,
  prevEntry,
  nextEntry,
  onSwap,
  onRemove,
}) => {
  const [editing, setEditing] = useState(false);
  const [removeConfirm, modals] = useRemoveConfirm();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const { deferredImageHandler, flushPendingImages, pendingObjectUrls } = usePendingImages();
  const startEditing = useCallback(() => {
    setQuestion(entry.question);
    setAnswer(entry.answer);
    setUndoStack({ prev: [], next: [] });
    setEditing(true);
  }, [entry.question, entry.answer]);
  const cancel = useCallback(() => setEditing(false), []);
  const save = async () => {
    const finalAnswer = await flushPendingImages(answer);
    onUpdate({ question, answer: finalAnswer });
    setEditing(false);
  };
  const { isAdmin } = useUser()!;
  return (
    <Card shadow="md" withBorder my="md">
      {modals}
      {!editing && (
        <Group justify="space-between" mb="xs">
          <Title order={3}>{entry.question}</Title>
          {isAdmin && (
            <IconButton
              tooltip="Edit FAQ entry"
              icon={<IconEdit />}
              onClick={() => startEditing()}
            />
          )}
        </Group>
      )}
      {editing ? (
        <Suspense fallback={<Loader />}>
          <TextInput
            placeholder="Question"
            mb="sm"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
          <Editor
            imageHandler={deferredImageHandler}
            value={answer}
            onChange={setAnswer}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            preview={value => <MarkdownText value={value} pendingImages={pendingObjectUrls} />}
          />
        </Suspense>
      ) : (
        <MarkdownText value={entry.answer} />
      )}
      {isAdmin && editing && (
        <Flex mt="sm" justify="space-between">
          <Button size="sm" leftSection={<IconDeviceFloppy />} onClick={save}>
            Save
          </Button>
          <Button leftSection={<IconX />} onClick={cancel}>
            Cancel
          </Button>
        </Flex>
      )}
      {isAdmin && !editing && (
        <Group justify="right">
          <Button.Group>
            {!editing && (
              <>
                <IconButton
                  tooltip="Move up"
                  icon={<IconArrowUp />}
                  disabled={prevEntry === undefined}
                  onClick={() => prevEntry && onSwap(entry, prevEntry)}
                />
                <IconButton
                  tooltip="Move down"
                  icon={<IconArrowDown />}
                  disabled={nextEntry === undefined}
                  onClick={() => nextEntry && onSwap(entry, nextEntry)}
                />
                <IconButton
                  tooltip="Delete FAQ entry"
                  icon={<IconTrash />}
                  onClick={() =>
                    removeConfirm(
                      "Are you sure that you want to remove this FAQ entry?",
                      onRemove,
                    )
                  }
                />
              </>
            )}
          </Button.Group>
        </Group>
      )}
    </Card>
  );
};
export default FAQEntryComponent;
