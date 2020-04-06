import { useRequest } from "@umijs/hooks";
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  Input,
  CardFooter,
  Button,
} from "@vseth/components";
import * as React from "react";
import { useState } from "react";
import {
  fetchGet,
  fetchPost,
  imageHandler,
  fetchPut,
  fetchDelete,
} from "../api/fetch-utils";
import FAQEntryComponent from "../components/faq-entry";
import IconButton from "../components/icon-button";
import { FAQEntry } from "../interfaces";
import Editor from "../components/Editor";
import { UndoStack } from "../components/Editor/utils/undo-stack";
import MarkdownText from "../components/markdown-text";
import TwoButtons from "../components/two-buttons";

const laodFAQs = async () => {
  return (await fetchGet("/api/faq/")).value as FAQEntry[];
};
const addFAQ = async (question: string, answer: string, order: number) => {
  return (
    await fetchPost("/api/faq/", {
      question,
      answer,
      order,
    })
  ).value as FAQEntry;
};
const updateFAQ = async (oid: string, changes: Partial<FAQEntry>) => {
  return (await fetchPut(`/api/faq/${oid}/`, changes)).value as FAQEntry;
};
const swapFAQ = async (a: FAQEntry, b: FAQEntry) => {
  return Promise.all([
    updateFAQ(a.oid, { order: b.order }),
    updateFAQ(b.oid, { order: a.order }),
  ]);
};
const deleteFAQ = async (oid: string) => {
  await fetchDelete(`/api/faq/${oid}/`);
  return oid;
};
const sorted = (arg: FAQEntry[]) => arg.sort((a, b) => a.order - b.order);

export const FAQC: React.FC = () => {
  const { data: faqs, mutate } = useRequest(laodFAQs, { cacheKey: "faqs" });
  const [hasDraft, setHasDraft] = useState(false);
  const { run: runAddFAQ } = useRequest(addFAQ, {
    manual: true,
    onSuccess: newFAQ => {
      mutate(prevEntries => sorted([...prevEntries, newFAQ]));
    },
  });
  const { run: runUpdateFAQ } = useRequest(updateFAQ, {
    manual: true,
    onSuccess: changed => {
      mutate(prevEntry =>
        sorted(
          prevEntry.map(entry => (entry.oid === changed.oid ? changed : entry)),
        ),
      );
    },
  });
  const { run: runSwapFAQ } = useRequest(swapFAQ, {
    manual: true,
    onSuccess: ([newA, newB]) => {
      mutate(prevEntry =>
        sorted(
          prevEntry.map(entry =>
            entry.oid === newA.oid
              ? newA
              : entry.oid === newB.oid
              ? newB
              : entry,
          ),
        ),
      );
    },
  });
  const { run: runDeleteFAQ } = useRequest(deleteFAQ, {
    manual: true,
    onSuccess: removedOid =>
      mutate(prevEntry => prevEntry.filter(entry => entry.oid !== removedOid)),
  });
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
    runAddFAQ(
      question,
      answer,
      faqs?.reduce((old, value) => Math.max(old, value.order), 0) ?? 0,
    );
    handleDeleteDraft();
  };

  return (
    <Container>
      <div>
        <h1>FAQs</h1>
        <p>
          If you have any question not yet answered below, feel free to contact
          us at{" "}
          <a href="mailto:communitysolutions@vis.ethz.ch">
            communitysolutions@vis.ethz.ch
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
            onUpdate={changes => runUpdateFAQ(faq.oid, changes)}
            onSwap={runSwapFAQ}
            onRemove={() => runDeleteFAQ(faq.oid)}
          />
        ))}
      {hasDraft ? (
        <Card style={{ margin: "1em 0" }}>
          <CardHeader tag="h4">
            <Input
              type="text"
              placeholder="Question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </CardHeader>
          <CardBody>
            <Editor
              imageHandler={imageHandler}
              value={answer}
              onChange={setAnswer}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
              preview={value => <MarkdownText value={value} />}
            />
          </CardBody>
          <CardFooter>
            <TwoButtons
              left={
                <IconButton
                  color="primary"
                  size="sm"
                  icon="SAVE"
                  onClick={handleNew}
                >
                  Save
                </IconButton>
              }
              right={
                <IconButton size="sm" icon="CLOSE" onClick={handleDeleteDraft}>
                  Delete Draft
                </IconButton>
              }
            />
          </CardFooter>
        </Card>
      ) : (
        <IconButton
          block
          size="lg"
          icon="PLUS"
          onClick={() => setHasDraft(true)}
        />
      )}
    </Container>
  );
};
export default FAQC;
