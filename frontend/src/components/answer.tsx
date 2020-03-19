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
  TextareaField,
} from "@vseth/components";
import React, { useCallback, useState } from "react";
import { Answer, AnswerSection } from "../interfaces";
import MarkdownText from "./markdown-text";
import Editor from "./Editor";
import { imageHandler } from "../fetch-utils";
import { UndoStack } from "./Editor/utils/undo-stack";

interface Props {
  section: AnswerSection;
  answer?: Answer;
  onSectionChanged: (newSection: AnswerSection) => void;
  onDelete?: () => void;
}
const AnswerComponent: React.FC<Props> = ({ section, answer, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen(old => !old), []);
  const [editing, setEditing] = useState(false);

  const [draftText, setDraftText] = useState(answer?.text ?? "");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  return (
    <>
      <Card style={{ marginTop: "2em", marginBottom: "2em" }}>
        <CardHeader tag="h6">
          {answer?.authorDisplayName ?? "(Draft)"}
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

          <div style={{ textAlign: "right" }}>
            <ButtonGroup>
              {answer === undefined && (
                <Button size="sm" onClick={onDelete}>
                  Delete Draft
                </Button>
              )}
              {answer !== undefined && <Button size="sm">Add Comment</Button>}
              {answer !== undefined && (
                <ButtonDropdown isOpen={isOpen} toggle={toggle}>
                  <DropdownToggle size="sm" caret>
                    More
                  </DropdownToggle>
                  <DropdownMenu>
                    {answer === undefined && (
                      <DropdownItem onClick={onDelete || (() => undefined)}>
                        Delete Draft
                      </DropdownItem>
                    )}
                    <DropdownItem>Flag as Inappropriate</DropdownItem>
                    <DropdownItem>Permalink</DropdownItem>
                  </DropdownMenu>
                </ButtonDropdown>
              )}
            </ButtonGroup>
          </div>
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
