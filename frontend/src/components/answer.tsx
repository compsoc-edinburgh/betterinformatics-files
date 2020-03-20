import { useRequest } from "@umijs/hooks";
import {
  Button,
  ButtonDropdown,
  ButtonGroup,
  Card,
  CardBody,
  Icon,
  ICONS,
  CardHeader,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
} from "@vseth/components";
import React, { useCallback, useState } from "react";
import { fetchpost, imageHandler } from "../fetch-utils";
import { Answer, AnswerSection } from "../interfaces";
import CommentSectionComponent from "./comment-section";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import Score from "./score";
import TwoButtons from "./two-buttons";
import { useUser } from "../auth";
import { css } from "emotion";
import useConfirm from "../hooks/useConfirm";

const bodyCanEditStyle = css`
  position: relative;
  padding-top: 2em !important;
`;
const actionButtonContainer = css`
  position: absolute;
  top: 0;
  right: 0;
`;

const updateAnswer = async (
  answerId: string,
  text: string,
  legacy_answer: boolean,
) => {
  return (
    await fetchpost(`/api/exam/setanswer/${answerId}/`, { text, legacy_answer })
  ).value as AnswerSection;
};
const removeAnwer = async (answerId: string) => {
  return (await fetchpost(`/api/exam/removeanswer/${answerId}/`, {}))
    .value as AnswerSection;
};

interface Props {
  section?: AnswerSection;
  answer?: Answer;
  onSectionChanged?: (newSection: AnswerSection) => void;
  onDelete?: () => void;
  isLegacyAnswer: boolean;
}
const AnswerComponent: React.FC<Props> = ({
  section,
  answer,
  onDelete,
  onSectionChanged,
  isLegacyAnswer,
}) => {
  const { loading: updating, run: runUpdateAnswer } = useRequest(updateAnswer, {
    manual: true,
    onSuccess: res => {
      if (onSectionChanged) onSectionChanged(res);
      if (answer === undefined && onDelete) onDelete();
      setEditing(false);
    },
  });
  const { isAdmin } = useUser()!;
  const [confirm, modals] = useConfirm();
  const { run: runRemoveAnswer } = useRequest(removeAnwer, {
    manual: true,
    onSuccess: onSectionChanged,
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
    if (section) runUpdateAnswer(section.oid, draftText, false);
  }, [section, draftText, runUpdateAnswer]);
  const remove = () => {
    if (answer) confirm("Remove answer?", () => runRemoveAnswer(answer.oid));
  };
  const [hasCommentDraft, setHasCommentDraft] = useState(false);

  const canEdit = onSectionChanged && (answer?.canEdit || false);
  const canRemove = onSectionChanged && (isAdmin || answer?.canEdit || false);
  return (
    <>
      {modals}
      <Card style={{ marginTop: "2em", marginBottom: "2em" }}>
        <CardHeader>
          <TwoButtons
            left={
              <h6 style={{ margin: 0 }}>
                {answer?.authorDisplayName ??
                  (isLegacyAnswer ? "(Legacy Draft)" : "(Draft)")}
              </h6>
            }
            right={
              answer &&
              onSectionChanged && (
                <Score
                  oid={answer.oid}
                  upvotes={answer.upvotes}
                  expertUpvotes={answer.expertvotes}
                  userVote={answer.isUpvoted ? 1 : answer.isDownvoted ? -1 : 0}
                  onSectionChanged={onSectionChanged}
                />
              )
            }
          />
        </CardHeader>
        <CardBody className={canEdit ? bodyCanEditStyle : ""}>
          <div className={actionButtonContainer}>
            <ButtonGroup>
              {!editing && canEdit && (
                <Button
                  size="sm"
                  color="white"
                  style={{ minWidth: 0 }}
                  onClick={startEdit}
                >
                  <Icon icon={ICONS.EDIT} size={18} />
                </Button>
              )}
              {answer && canRemove && (
                <Button
                  size="sm"
                  color="white"
                  style={{ minWidth: 0 }}
                  onClick={remove}
                >
                  <Icon icon={ICONS.DELETE} size={18} />
                </Button>
              )}
            </ButtonGroup>
          </div>
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
              onSectionChanged && (
                <>
                  <ButtonGroup>
                    {(answer === undefined || editing) && (
                      <Button size="sm" onClick={onCancel}>
                        {editing ? "Cancel" : "Delete Draft"}
                      </Button>
                    )}
                    {answer !== undefined && (
                      <Button
                        size="sm"
                        onClick={() => setHasCommentDraft(true)}
                        disabled={hasCommentDraft}
                      >
                        Add Comment
                      </Button>
                    )}
                    {answer !== undefined && (
                      <ButtonDropdown isOpen={isOpen} toggle={toggle}>
                        <DropdownToggle size="sm" caret>
                          More
                        </DropdownToggle>
                        <DropdownMenu>
                          <DropdownItem>Flag as Inappropriate</DropdownItem>
                          <DropdownItem>Permalink</DropdownItem>
                        </DropdownMenu>
                      </ButtonDropdown>
                    )}
                  </ButtonGroup>
                </>
              )
            }
          />
          {answer &&
            onSectionChanged &&
            (hasCommentDraft || answer.comments.length > 0) && (
              <CommentSectionComponent
                hasDraft={hasCommentDraft}
                answer={answer}
                onSectionChanged={onSectionChanged}
                onDraftDelete={() => setHasCommentDraft(false)}
              />
            )}
        </CardBody>
      </Card>
    </>
  );
};

export default AnswerComponent;
