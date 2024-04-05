import { Button, Card, Flex, Group, TextInput, Title } from "@mantine/core";
import React, { useCallback, useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { FAQEntry } from "../interfaces";
import Editor from "./Editor";
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
  const [confirm, modals] = useConfirm();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const startEditing = useCallback(() => {
    setQuestion(entry.question);
    setAnswer(entry.answer);
    setUndoStack({ prev: [], next: [] });
    setEditing(true);
  }, [entry.question, entry.answer]);
  const cancel = useCallback(() => setEditing(false), []);
  const save = () => {
    onUpdate({ question, answer });
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
        <>
          <TextInput
            placeholder="Question"
            mb="sm"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
          <Editor
            imageHandler={imageHandler}
            value={answer}
            onChange={setAnswer}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            preview={value => <MarkdownText value={value} />}
          />
        </>
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
                    confirm(
                      "Are you sure that you want to remove this?",
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
