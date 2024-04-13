import * as React from "react";
import { useState } from "react";
import { useFAQ } from "../api/faq";
import { imageHandler } from "../api/fetch-utils";
import { useUser } from "../auth";
import Editor from "../components/Editor";
import { UndoStack } from "../components/Editor/utils/undo-stack";
import FAQEntryComponent from "../components/faq-entry";
import MarkdownText from "../components/markdown-text";
import useTitle from "../hooks/useTitle";
import serverData from "../utils/server-data";
import { Button, Card, Container, Flex, TextInput } from "@mantine/core";
import { IconDeviceFloppy, IconPlus, IconX } from "@tabler/icons-react";

export const FAQPage: React.FC = () => {
  useTitle("FAQ");
  const { isAdmin } = useUser()!;
  const { faqs, add, update, swap, remove } = useFAQ();
  const [hasDraft, setHasDraft] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const handleDeleteDraft = () => {
    setQuestion("");
    setAnswer("");
    setUndoStack({ prev: [], next: [] });
    setHasDraft(false);
  };
  const handleNew = () => {
    add(
      question,
      answer,
      (faqs || []).reduce((old, value) => Math.max(old, value.order + 1), 0),
    );
    handleDeleteDraft();
  };

  return (
    <Container size="xl">
      <div>
        <h1>FAQs</h1>
        <p>
          If you have any question not yet answered below, feel free to contact
          us at{" "}
          <a href={`mailto:${serverData.email_address}`}>
            {serverData.email_address}
          </a>
          .
        </p>
      </div>
      {faqs &&
        faqs.map((faq, idx) => (
          <FAQEntryComponent
            key={faq.oid}
            entry={faq}
            prevEntry={idx > 0 ? faqs[idx - 1] : undefined}
            nextEntry={idx + 1 < faqs.length ? faqs[idx + 1] : undefined}
            onUpdate={changes => update(faq.oid, changes)}
            onSwap={swap}
            onRemove={() => remove(faq.oid)}
          />
        ))}
      {hasDraft ? (
        <Card withBorder shadow="md" my="xs">
          <TextInput
            placeholder="Question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            mb="sm"
          />
          <Editor
            imageHandler={imageHandler}
            value={answer}
            onChange={setAnswer}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            preview={value => <MarkdownText value={value} />}
          />
          <Flex mt="sm" justify="space-between">
            <Button
              size="sm"
              leftSection={<IconDeviceFloppy />}
              onClick={handleNew}
            >
              Save
            </Button>
            <Button
              size="sm"
              leftSection={<IconX />}
              onClick={handleDeleteDraft}
            >
              Delete Draft
            </Button>
          </Flex>
        </Card>
      ) : (
        isAdmin && (
          <Button
            color="dark"
            my="md"
            leftSection={<IconPlus />}
            onClick={() => setHasDraft(true)}
          >
            Add new FAQ entry
          </Button>
        )
      )}
    </Container>
  );
};
export default FAQPage;
