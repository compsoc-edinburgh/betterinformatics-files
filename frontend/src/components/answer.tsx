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
import { css } from "emotion";
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

const bodyCanEditStyle = css`
  position: relative;
  padding-top: 2.3em !important;
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
    if (section) update(section.oid, draftText, false);
  }, [section, draftText, update]);
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
            <Col xs="auto">
              <AuthorWrapper>
                {answer?.authorDisplayName ??
                  (isLegacyAnswer ? "(Legacy Draft)" : "(Draft)")}
              </AuthorWrapper>
            </Col>
            <Col xs="auto">
              <AnswerToolbar>
                {answer && (answer.expertvotes > 0 || setExpertVoteLoading) && (
                  <ButtonGroup className="m-1" size="sm">
                    <IconButton
                      tooltip="This answer is endorsed by an expert"
                      color="primary"
                      icon="STAR_FILLED"
                      active
                    />
                    <SmallButton color="primary" active>
                      {answer.expertvotes}
                    </SmallButton>
                    <IconButton
                      color="primary"
                      tooltip={
                        answer.isExpertVoted
                          ? "Remove expert vote"
                          : "Add expert vote"
                      }
                      icon={answer.isExpertVoted ? "CLOSE" : "PLUS"}
                      onClick={() =>
                        setExpertVote(answer.oid, !answer.isExpertVoted)
                      }
                    />
                  </ButtonGroup>
                )}
                {answer && (answer.flagged > 0 || flaggedLoading) && (
                  <ButtonGroup className="m-1" size="sm">
                    <IconButton
                      tooltip="This answer was flagged as inappropriate by a user. A moderator will decide if the answer should be removed."
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
                      icon={answer.isFlagged ? "CLOSE" : "PLUS"}
                      onClick={() => setFlagged(answer.oid, !answer.isFlagged)}
                    />
                    {isAdmin && (
                      <IconButton
                        tooltip="Remove all inappropriate flags"
                        color="danger"
                        icon="DELETE"
                        onClick={() => resetFlagged(answer.oid)}
                      />
                    )}
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
        <CardBody className={canRemove ? bodyCanEditStyle : ""}>
          <div className="position-absolute position-top-right">
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
                          {answer.expertvotes === 0 && isExpert && (
                            <DropdownItem
                              onClick={() => setFlagged(answer.oid, true)}
                            >
                              Endorse Answer
                            </DropdownItem>
                          )}
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
