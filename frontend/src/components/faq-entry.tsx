import {
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Input,
} from "@vseth/components";
import React, { useCallback, useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import useConfirm from "../hooks/useConfirm";
import { FAQEntry } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";
import TwoButtons from "./two-buttons";
import { useUser } from "../auth";
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
    <Card className="my-1">
      {modals}
      <CardBody>
        <h4>
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
        </h4>
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
        {isAdmin && (
          <div className="my-2">
            <TwoButtons
              left={
                editing && (
                  <IconButton
                    color="primary"
                    size="sm"
                    icon="SAVE"
                    onClick={save}
                  >
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
          </div>
        )}
      </CardBody>
    </Card>
  );
};
export default FAQEntryComponent;
