import {
  Card,
  CardBody,
  CardFooter,
  Container,
  Input,
  Row,
  Col,
} from "@vseth/components";
import * as React from "react";
import { useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import { useFAQ } from "../api/faq";
import Editor from "../components/Editor";
import { UndoStack } from "../components/Editor/utils/undo-stack";
import FAQEntryComponent from "../components/faq-entry";
import IconButton from "../components/icon-button";
import MarkdownText from "../components/markdown-text";
import useTitle from "../hooks/useTitle";
import { css } from "emotion";
const newButtonStyle = css`
  min-height: 3em;
`;
export const FAQC: React.FC = () => {
  useTitle("FAQ - VIS Community Solutions");
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
            onUpdate={changes => update(faq.oid, changes)}
            onSwap={swap}
            onRemove={() => remove(faq.oid)}
          />
        ))}
      {hasDraft ? (
        <Card className="my-2">
          <CardBody>
            <h4>
              <Input
                type="text"
                placeholder="Question"
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />
            </h4>
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
            <Row className="flex-between">
              <Col xs="auto">
                <IconButton
                  color="primary"
                  size="sm"
                  icon="SAVE"
                  onClick={handleNew}
                >
                  Save
                </IconButton>
              </Col>
              <Col xs="auto">
                <IconButton size="sm" icon="CLOSE" onClick={handleDeleteDraft}>
                  Delete Draft
                </IconButton>
              </Col>
            </Row>
          </CardFooter>
        </Card>
      ) : (
        <Card className={`my-2 ${newButtonStyle}`}>
          <IconButton
            tooltip="Add new FAQ entry"
            className="position-cover"
            block
            size="lg"
            icon="PLUS"
            onClick={() => setHasDraft(true)}
          />
        </Card>
      )}
    </Container>
  );
};
export default FAQC;
