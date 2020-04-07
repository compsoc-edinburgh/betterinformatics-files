import { useRequest } from "@umijs/hooks";
import {
  Button,
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
} from "@vseth/components";
import { css } from "emotion";
import React, { useCallback, useState } from "react";
import { fetchPost, imageHandler } from "../api/fetch-utils";
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
import TwoButtons from "./two-buttons";
import styled from "@emotion/styled";
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

const updateAnswer = async (
  answerId: string,
  text: string,
  legacy_answer: boolean,
) => {
  return (
    await fetchPost(`/api/exam/setanswer/${answerId}/`, { text, legacy_answer })
  ).value as AnswerSection;
};
const removeAnwer = async (answerId: string) => {
  return (await fetchPost(`/api/exam/removeanswer/${answerId}/`, {}))
    .value as AnswerSection;
};
const setFlagged = async (oid: string, flagged: boolean) => {
  return (
    await fetchPost(`/api/exam/setflagged/${oid}/`, {
      flagged,
    })
  ).value as AnswerSection;
};
const resetFlagged = async (oid: string) => {
  return (await fetchPost(`/api/exam/resetflagged/${oid}/`, {}))
    .value as AnswerSection;
};
const setExpertVote = async (oid: string, vote: boolean) => {
  return (
    await fetchPost(`/api/exam/setexpertvote/${oid}/`, {
      vote,
    })
  ).value as AnswerSection;
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
  const {
    loading: setFlaggedLoading,
    run: runSetFlagged,
  } = useRequest(setFlagged, { manual: true, onSuccess: onSectionChanged });
  const {
    loading: setExpertVoteLoading,
    run: runSetExpertVote,
  } = useRequest(setExpertVote, { manual: true, onSuccess: onSectionChanged });
  const {
    loading: resetFlaggedLoading,
    run: runResetFlagged,
  } = useRequest(resetFlagged, { manual: true, onSuccess: onSectionChanged });
  const flaggedLoading = setFlaggedLoading || resetFlaggedLoading;
  const { loading: updating, run: runUpdateAnswer } = useRequest(updateAnswer, {
    manual: true,
    onSuccess: res => {
      if (onSectionChanged) onSectionChanged(res);
      if (answer === undefined && onDelete) onDelete();
      setEditing(false);
    },
  });
  const { isAdmin, isExpert } = useUser()!;
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
      <AnswerWrapper id={answer?.longId}>
        <CardHeader>
          <TwoButtons
            left={
              <AuthorWrapper>
                {answer?.authorDisplayName ??
                  (isLegacyAnswer ? "(Legacy Draft)" : "(Draft)")}
              </AuthorWrapper>
            }
            right={
              <AnswerToolbar>
                {answer && (answer.expertvotes > 0 || setExpertVoteLoading) && (
                  <ButtonGroup className="m-1" size="sm">
                    <IconButton
                      color="primary"
                      icon="STAR_FILLED"
                      title={"This answer is endorsed by an expert"}
                      active
                    />
                    <SmallButton color="primary" active>
                      {answer.expertvotes}
                    </SmallButton>
                    <IconButton
                      color="primary"
                      icon={answer.isFlagged ? "CLOSE" : "PLUS"}
                      onClick={() =>
                        runSetExpertVote(answer.oid, !answer.isExpertVoted)
                      }
                    />
                  </ButtonGroup>
                )}
                {answer && (answer.flagged > 0 || flaggedLoading) && (
                  <ButtonGroup className="m-1" size="sm">
                    <IconButton
                      color="danger"
                      icon="FLAG"
                      title="Flagged as Inappropriate"
                      active
                    >
                      Inappropriate
                    </IconButton>
                    <SmallButton color="danger" active>
                      {answer.flagged}
                    </SmallButton>
                    <IconButton
                      color="danger"
                      icon={answer.isFlagged ? "CLOSE" : "PLUS"}
                      onClick={() =>
                        runSetFlagged(answer.oid, !answer.isFlagged)
                      }
                    />
                    {isAdmin && (
                      <IconButton
                        color="danger"
                        icon="DELETE"
                        onClick={() => runResetFlagged(answer.oid)}
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
            }
          />
        </CardHeader>
        <CardBody className={canRemove ? bodyCanEditStyle : ""}>
          <div className="position-absolute position-top-right">
            <ButtonGroup>
              {!editing && canEdit && (
                <SmallButton size="sm" color="white" onClick={startEdit}>
                  <Icon icon={ICONS.EDIT} size={18} />
                </SmallButton>
              )}
              {answer && canRemove && (
                <SmallButton size="sm" color="white" onClick={remove}>
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
          <TwoButtons
            left={
              <>
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
              </>
            }
            right={
              onSectionChanged && (
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
                              onClick={() => runSetExpertVote(answer.oid, true)}
                            >
                              Endorse Answer
                            </DropdownItem>
                          )}
                          {answer.flagged === 0 && (
                            <DropdownItem
                              onClick={() => runSetFlagged(answer.oid, true)}
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
      </AnswerWrapper>
    </>
  );
};

export default AnswerComponent;
