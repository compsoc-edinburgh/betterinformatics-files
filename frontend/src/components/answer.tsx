import {
  Button,
  ButtonDropdown,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
} from "@vseth/components";
import React, { useCallback, useState } from "react";
import { imageHandler, fetchpost } from "../fetch-utils";
import { Answer, AnswerSection } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import TwoButtons from "./two-buttons";
import { useRequest } from "@umijs/hooks";
import Score from "./score";

const setAnswer = async (oid: string, text: string, legacy_answer: boolean) => {
  return (
    await fetchpost(`/api/exam/setanswer/${oid}/`, { text, legacy_answer })
  ).value as AnswerSection;
};

interface Props {
  section: AnswerSection;
  answer?: Answer;
  onSectionChanged: (newSection: AnswerSection) => void;
  onDelete?: () => void;
}
const AnswerComponent: React.FC<Props> = ({
  section,
  answer,
  onDelete,
  onSectionChanged,
}) => {
  const { loading: updating, run } = useRequest(setAnswer, {
    manual: true,
    onSuccess: res => {
      onSectionChanged(res);
      if (answer === undefined && onDelete) onDelete();
      setEditing(false);
    },
  });
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen(old => !old), []);
  const [editing, setEditing] = useState(false);

  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const startEdit = useCallback(() => {
    setDraftText(answer?.text ?? "");
    setEditing(true);
  }, [answer]);
  const onCancel = useCallback(() => {
    setEditing(false);
    if (answer === undefined && onDelete) onDelete();
  }, [onDelete, answer]);
  const save = useCallback(() => {
    run(section.oid, draftText, false);
  }, [section.oid, draftText, run]);

  return (
    <>
      <Card style={{ marginTop: "2em", marginBottom: "2em" }}>
        <CardHeader>
          <TwoButtons
            left={<h6>{answer?.authorDisplayName ?? "(Draft)"}</h6>}
            right={answer && <Score currentScore={answer.upvotes} />}
          />
        </CardHeader>
        <CardBody>
          {editing || answer === undefined ? (
            <Editor
              value={draftText}
              onChange={setDraftText}
              imageHandler={imageHandler}
              preview={value => <MarkdownText value={value} />}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
            />
          ) : (
            <MarkdownText value={answer?.text ?? ""} />
          )}
          <TwoButtons
            left={
              <>
                {(answer === undefined || editing) && (
                  <Button
                    color="primary"
                    size="sm"
                    onClick={save}
                    disabled={updating}
                  >
                    {updating ? <Spinner /> : "Save"}
                  </Button>
                )}
              </>
            }
            right={
              <>
                <ButtonGroup>
                  {(answer === undefined || editing) && (
                    <Button size="sm" onClick={onCancel}>
                      {editing ? "Cancel" : "Delete Draft"}
                    </Button>
                  )}
                  {answer !== undefined && (
                    <Button size="sm">Add Comment</Button>
                  )}
                  {answer !== undefined && (
                    <ButtonDropdown isOpen={isOpen} toggle={toggle}>
                      <DropdownToggle size="sm" caret>
                        More
                      </DropdownToggle>
                      <DropdownMenu>
                        {answer.canEdit && !editing && (
                          <DropdownItem onClick={startEdit}>Edit</DropdownItem>
                        )}
                        <DropdownItem>Flag as Inappropriate</DropdownItem>
                        <DropdownItem>Permalink</DropdownItem>
                      </DropdownMenu>
                    </ButtonDropdown>
                  )}
                </ButtonGroup>
              </>
            }
          />
        </CardBody>
      </Card>
      {answer && answer.comments.length > 0 && (
        <Container>
          {answer.comments.map(comment => (
            <>{comment.text}</>
          ))}
        </Container>
      )}
    </>
  );
};

export default AnswerComponent;
