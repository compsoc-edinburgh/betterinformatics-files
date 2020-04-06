import React, { useState, useCallback } from "react";
import { css } from "glamor";
import { FAQEntry } from "../interfaces";
import { fetchDelete, fetchPut, imageHandler } from "../api/fetch-utils";
import Colors from "../colors";
import Editor from "./Editor";
import MarkdownText from "./markdown-text";
import { UndoStack } from "./Editor/utils/undo-stack";
import {
  Card,
  CardHeader,
  CardBody,
  ButtonGroup,
  Input,
} from "@vseth/components";
import TwoButtons from "./two-buttons";
import IconButton from "./icon-button";
import useConfirm from "../hooks/useConfirm";
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
  return (
    <Card style={{ margin: "1em 0" }}>
      {modals}
      <CardHeader tag="h3">
        {!editing && (
          <IconButton close icon="EDIT" onClick={() => startEditing()} />
        )}
        {editing ? (
          <Input
            type="text"
            placeholder="Question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        ) : (
          entry.question
        )}
      </CardHeader>
      <CardBody>
        {editing ? (
          <Editor
            imageHandler={imageHandler}
            value={answer}
            onChange={setAnswer}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            preview={value => <MarkdownText value={value} />}
          />
        ) : (
          <MarkdownText value={entry.answer} />
        )}
        <TwoButtons
          left={
            editing && (
              <IconButton color="primary" size="sm" icon="SAVE" onClick={save}>
                Save
              </IconButton>
            )
          }
          right={
            <ButtonGroup size="sm">
              <IconButton
                icon="ARROW_UP"
                disabled={prevEntry === undefined}
                onClick={() => prevEntry && onSwap(entry, prevEntry)}
              />
              <IconButton
                icon="ARROW_DOWN"
                disabled={nextEntry === undefined}
                onClick={() => nextEntry && onSwap(entry, nextEntry)}
              />
              <IconButton
                icon="DELETE"
                onClick={() =>
                  confirm(
                    "Are you sure that you want to remove this?",
                    onRemove,
                  )
                }
              />
              {editing && (
                <IconButton icon="CLOSE" onClick={cancel}>
                  Cancel
                </IconButton>
              )}
            </ButtonGroup>
          }
        />
      </CardBody>
    </Card>
  );
};
export default FAQEntryComponent;
