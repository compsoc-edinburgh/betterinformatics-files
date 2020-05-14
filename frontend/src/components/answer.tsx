import styled from "@emotion/styled";
import {
  ButtonDropdown,
  ButtonGroup,
  ButtonToolbar,
  Card,
  CardBody,
  CardHeader,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Icon,
  ICONS,
  Row,
  Col,
} from "@vseth/components";
import React, { useCallback, useState } from "react";
import { imageHandler } from "../api/fetch-utils";
import {
  useRemoveAnswer,
  useResetFlaggedVote,
  useSetExpertVote,
  useSetFlagged,
  useUpdateAnswer,
} from "../api/hooks";
import { useUser } from "../auth";
import useConfirm from "../hooks/useConfirm";
import { Answer, AnswerSection } from "../interfaces";
import { copy } from "../utils/clipboard";
import CommentSectionComponent from "./comment-section";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";
import Score from "./score";
import SmallButton from "./small-button";

const AnswerWrapper = styled(Card)`
  margin-top: 1em;
  margin-bottom: 1em;
`;

const AuthorWrapper = styled.h6`
  margin: 0;
`;

const AnswerToolbar = styled(ButtonToolbar)`
  justify-content: flex-end;
  margin: 0 -0.3em;
`;

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
  const [setFlaggedLoading, setFlagged] = useSetFlagged(onSectionChanged);
  const [resetFlaggedLoading, resetFlagged] = useResetFlaggedVote(
    onSectionChanged,
  );
  const [setExpertVoteLoading, setExpertVote] = useSetExpertVote(
    onSectionChanged,
  );
  const removeAnswer = useRemoveAnswer(onSectionChanged);
  const [updating, update] = useUpdateAnswer(res => {
    setEditing(false);
    if (onSectionChanged) onSectionChanged(res);
    if (answer === undefined && onDelete) onDelete();
  });
  const { isAdmin, isExpert } = useUser()!;
  const [confirm, modals] = useConfirm();
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
    if (section) update(section.oid, draftText, isLegacyAnswer);
  }, [section, draftText, update, isLegacyAnswer]);
  const remove = useCallback(() => {
    if (answer) confirm("Remove answer?", () => removeAnswer(answer.oid));
  }, [confirm, removeAnswer, answer]);
  const [hasCommentDraft, setHasCommentDraft] = useState(false);

  const flaggedLoading = setFlaggedLoading || resetFlaggedLoading;
  const canEdit = onSectionChanged && (answer?.canEdit || false);
  const canRemove = onSectionChanged && (isAdmin || answer?.canEdit || false);
  return (
    <>
      {modals}
      <AnswerWrapper id={answer?.longId}>
        <CardHeader>
          <Row className="flex-between">
            <Col xs="auto" className="d-flex flex-center flex-column">
              <AuthorWrapper>
                {answer?.authorDisplayName ??
                  (isLegacyAnswer ? "(Legacy Draft)" : "(Draft)")}
              </AuthorWrapper>
            </Col>
            <Col xs="auto">
              <AnswerToolbar>
                {answer &&
                  (answer.expertvotes > 0 ||
                    setExpertVoteLoading ||
                    isExpert) && (
                    <ButtonGroup className="m-1" size="sm">
                      <IconButton
                        color="primary"
                        size="sm"
                        tooltip="This answer is endorsed by an expert"
                        icon="STAR_FILLED"
                        active
                      />
                      <SmallButton color="primary" size="sm" active>
                        {answer.expertvotes}
                      </SmallButton>
                      {isExpert && (
                        <IconButton
                          color="primary"
                          size="sm"
                          loading={setExpertVoteLoading}
                          tooltip={
                            answer.isExpertVoted
                              ? "Remove expert vote"
                              : "Add expert vote"
                          }
                          icon={answer.isExpertVoted ? "MINUS" : "PLUS"}
                          onClick={() =>
                            setExpertVote(answer.oid, !answer.isExpertVoted)
                          }
                        />
                      )}
                    </ButtonGroup>
                  )}
                {answer &&
                  (answer.isFlagged ||
                    (answer.flagged > 0 && isAdmin) ||
                    flaggedLoading) && (
                    <ButtonGroup className="m-1" size="sm">
                      <IconButton
                        tooltip="This answer was flagged as inappropriate by a user. A moderator will decide whether the answer should be removed."
                        color="danger"
                        icon="FLAG"
                        title="Flagged as Inappropriate"
                        active
                      >
                        Inappropriate
                      </IconButton>
                      <SmallButton
                        color="danger"
                        tooltip={`${answer.flagged} users consider this answer inappropriate.`}
                        active
                      >
                        {answer.flagged}
                      </SmallButton>
                      <IconButton
                        color="danger"
                        tooltip={
                          answer.isFlagged
                            ? "Remove inappropriate flag"
                            : "Add inappropriate flag"
                        }
                        size="sm"
                        loading={flaggedLoading}
                        icon={answer.isFlagged ? "MINUS" : "PLUS"}
                        onClick={() =>
                          setFlagged(answer.oid, !answer.isFlagged)
                        }
                      />
                    </ButtonGroup>
                  )}
                {answer && onSectionChanged && (
                  <Score
                    oid={answer.oid}
                    upvotes={answer.upvotes}
                    expertUpvotes={answer.expertvotes}
                    userVote={
                      answer.isUpvoted ? 1 : answer.isDownvoted ? -1 : 0
                    }
                    onSectionChanged={onSectionChanged}
                  />
                )}
              </AnswerToolbar>
            </Col>
          </Row>
        </CardHeader>
        <div className="text-right">
          <ButtonGroup>
            {!editing && canEdit && (
              <SmallButton
                size="sm"
                color="white"
                onClick={startEdit}
                tooltip="Edit answer"
              >
                <Icon icon={ICONS.EDIT} size={18} />
              </SmallButton>
            )}
            {answer && canRemove && (
              <SmallButton
                size="sm"
                color="white"
                onClick={remove}
                tooltip="Delete answer"
              >
                <Icon icon={ICONS.DELETE} size={18} />
              </SmallButton>
            )}
          </ButtonGroup>
        </div>
        <CardBody className="pt-0">
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
            <div className="py-3">
              <MarkdownText value={answer?.text ?? ""} />
            </div>
          )}
          <Row className="flex-between">
            <Col xs="auto">
              {(answer === undefined || editing) && (
                <IconButton
                  className="m-1"
                  color="primary"
                  size="sm"
                  onClick={save}
                  loading={updating}
                  icon="SAVE"
                >
                  Save
                </IconButton>
              )}
            </Col>
            <Col xs="auto">
              {onSectionChanged && (
                <>
                  <ButtonGroup className="m-1">
                    {(answer === undefined || editing) && (
                      <IconButton size="sm" onClick={onCancel} icon="CLOSE">
                        {editing ? "Cancel" : "Delete Draft"}
                      </IconButton>
                    )}
                    {answer !== undefined && (
                      <IconButton
                        size="sm"
                        onClick={() => setHasCommentDraft(true)}
                        icon="PLUS"
                        disabled={hasCommentDraft}
                      >
                        Add Comment
                      </IconButton>
                    )}
                    {answer !== undefined && (
                      <ButtonDropdown isOpen={isOpen} toggle={toggle}>
                        <DropdownToggle size="sm" caret>
                          More
                        </DropdownToggle>
                        <DropdownMenu>
                          {answer.flagged === 0 && (
                            <DropdownItem
                              onClick={() => setFlagged(answer.oid, true)}
                            >
                              Flag as Inappropriate
                            </DropdownItem>
                          )}
                          <DropdownItem
                            onClick={() =>
                              copy(
                                `${document.location.origin}${document.location.pathname}#${answer.longId}`,
                              )
                            }
                          >
                            Copy Permalink
                          </DropdownItem>
                          {isAdmin && answer.flagged > 0 && (
                            <DropdownItem
                              onClick={() => resetFlagged(answer.oid)}
                            >
                              Remove all inappropriate flags
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </ButtonDropdown>
                    )}
                  </ButtonGroup>
                </>
              )}
            </Col>
          </Row>

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
      </AnswerWrapper>
    </>
  );
};

export default AnswerComponent;
