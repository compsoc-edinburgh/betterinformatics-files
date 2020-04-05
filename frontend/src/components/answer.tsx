import { useRequest } from "@umijs/hooks";
import {
  Button,
  ButtonDropdown,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Icon,
  ICONS,
  InputGroup,
  ButtonToolbar,
} from "@vseth/components";
import { css } from "emotion";
import React, { useCallback, useState } from "react";
import { useUser } from "../auth";
import { fetchPost, imageHandler } from "../api/fetch-utils";
import useConfirm from "../hooks/useConfirm";
import { Answer, AnswerSection } from "../interfaces";
import CommentSectionComponent from "./comment-section";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";
import Score from "./score";
import TwoButtons from "./two-buttons";
import { copy } from "../utils/clipboard";

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
      <Card
        style={{ marginTop: "2em", marginBottom: "2em" }}
        id={answer?.longId}
      >
        <CardHeader>
          <TwoButtons
            left={
              <h6 style={{ margin: 0 }}>
                {answer?.authorDisplayName ??
                  (isLegacyAnswer ? "(Legacy Draft)" : "(Draft)")}
              </h6>
            }
            right={
              <ButtonToolbar
                style={{ justifyContent: "flex-end", margin: "0 -0.3em" }}
              >
                {answer && (answer.expertvotes > 0 || setExpertVoteLoading) && (
                  <ButtonGroup size="sm" style={{ margin: "0 0.3em" }}>
                    <IconButton
                      color="primary"
                      icon="STAR_FILLED"
                      title={"This answer is endorsed by an expert"}
                      active
                    />
                    <Button style={{ minWidth: 0 }} color="primary" active>
                      {answer.expertvotes}
                    </Button>
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
                  <ButtonGroup size="sm" style={{ margin: "0 0.3em" }}>
                    <IconButton
                      color="danger"
                      icon="FLAG"
                      title="Flagged as Inappropriate"
                      active
                    >
                      Inappropriate
                    </IconButton>
                    <Button style={{ minWidth: 0 }} color="danger" active>
                      {answer.flagged}
                    </Button>
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
              </ButtonToolbar>
            }
          />
        </CardHeader>
        <CardBody className={canRemove ? bodyCanEditStyle : ""}>
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
                  <IconButton
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
                  <ButtonGroup>
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
      </Card>
    </>
  );
};

export default AnswerComponent;
