import { css } from "@emotion/css";
import {
  Button,
  Card,
  CardProps,
  Flex,
  Group,
  GroupProps,
  Menu,
} from "@mantine/core";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, ICONS } from "vseth-canine-ui";
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
import useToggle from "../hooks/useToggle";
import { Answer, AnswerSection } from "../interfaces";
import { copy } from "../utils/clipboard";
import CodeBlock from "./code-block";
import CommentSectionComponent from "./comment-section";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";
import Score from "./score";
import SmallButton from "./small-button";

const answerWrapperStyle = css`
  margin-top: 1em;
  margin-bottom: 1em;
`;
const AnswerWrapper = (props: CardProps) => (
  <Card withBorder className={answerWrapperStyle} {...props} />
);

const answerToolbarStyle = css`
  justify-content: flex-end;
  margin: 0 -0.3em;
`;

const AnswerToolbar = (props: GroupProps) => (
  <Group className={answerToolbarStyle} {...props} />
);

interface Props {
  section?: AnswerSection;
  answer?: Answer;
  onSectionChanged?: (newSection: AnswerSection) => void;
  onDelete?: () => void;
  isLegacyAnswer: boolean;
  hasId?: boolean;
}
const AnswerComponent: React.FC<Props> = ({
  section,
  answer,
  onDelete,
  onSectionChanged,
  isLegacyAnswer,
  hasId = true,
}) => {
  const [viewSource, toggleViewSource] = useToggle(false);
  const [setFlaggedLoading, setFlagged] = useSetFlagged(onSectionChanged);
  const [resetFlaggedLoading, resetFlagged] =
    useResetFlaggedVote(onSectionChanged);
  const [setExpertVoteLoading, setExpertVote] =
    useSetExpertVote(onSectionChanged);
  const removeAnswer = useRemoveAnswer(onSectionChanged);
  const [updating, update] = useUpdateAnswer(res => {
    setEditing(false);
    if (onSectionChanged) onSectionChanged(res);
    if (answer === undefined && onDelete) onDelete();
  });
  const { isAdmin, isExpert } = useUser()!;
  const [confirm, modals] = useConfirm();
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
  const canEdit = section && onSectionChanged && (answer?.canEdit || false);
  const canRemove =
    section && onSectionChanged && (isAdmin || answer?.canEdit || false);
  const { username } = useUser()!;
  return (
    <>
      {modals}
      <AnswerWrapper>
        <div className="d-flex flex-between align-items-center">
          <div>
            {!hasId && (
              <Link
                className="mr-2 text-muted"
                to={
                  answer ? `/exams/${answer.filename}#${answer.longId}` : ""
                }
              >
                <Icon icon={ICONS.LINK} size="1em" />
              </Link>
            )}
            {isLegacyAnswer ? (
              answer?.authorDisplayName ?? "(Legacy Draft)"
            ) : (
              <Link to={`/user/${answer?.authorId ?? username}`}>
                <span className="text-dark font-weight-bold">
                  {answer?.authorDisplayName ?? "(Draft)"}
                </span>
                <span className="text-muted ml-1">
                  @{answer?.authorId ?? username}
                </span>
              </Link>
            )}
            <span className="text-muted mx-1">·</span>
            {answer && (
              <span className="text-muted" title={answer.time}>
                {formatDistanceToNow(new Date(answer.time))} ago
              </span>
            )}
            {answer &&
              differenceInSeconds(
                new Date(answer.edittime),
                new Date(answer.time),
              ) > 1 && (
                <>
                  <span className="text-muted mx-1">·</span>
                  <span className="text-muted" title={answer.edittime}>
                    edited {formatDistanceToNow(new Date(answer.edittime))}{" "}
                    ago
                  </span>
                </>
              )}
          </div>
          <div className="d-flex">
            <AnswerToolbar>
              {answer &&
                (answer.expertvotes > 0 ||
                  setExpertVoteLoading ||
                  isExpert) && (
                  <Button.Group className="m-1">
                    <IconButton
                      color="primary"
                      size="sm"
                      tooltip="This answer is endorsed by an expert"
                      iconName={ICONS.STAR_FILLED}
                    />
                    <SmallButton color="primary" size="sm">
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
                        iconName={
                          answer.isExpertVoted ? ICONS.MINUS : ICONS.PLUS
                        }
                        onClick={() =>
                          setExpertVote(answer.oid, !answer.isExpertVoted)
                        }
                      />
                    )}
                  </Button.Group>
                )}
              {answer &&
                (answer.isFlagged ||
                  (answer.flagged > 0 && isAdmin) ||
                  flaggedLoading) && (
                  <Button.Group className="m-1">
                    <Button
                      color="danger"
                      leftIcon={<Icon icon={ICONS.FLAG} />}
                      title="Flagged as Inappropriate"
                    >
                      Inappropriate
                    </Button>
                    <SmallButton
                      color="danger"
                      tooltip={`${answer.flagged} users consider this answer inappropriate.`}
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
                      iconName={answer.isFlagged ? ICONS.MINUS : ICONS.PLUS}
                      onClick={() =>
                        setFlagged(answer.oid, !answer.isFlagged)
                      }
                    />
                  </Button.Group>
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
          </div>
        </div>
        {editing || answer === undefined ? (
          <div className="pt-3">
            <Editor
              value={draftText}
              onChange={setDraftText}
              imageHandler={imageHandler}
              preview={value => <MarkdownText value={value} />}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
            />
            Your answer will be licensed as{" "}
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
              CC BY-NC-SA 4.0
            </a>
            .
          </div>
        ) : (
          <div className="py-3">
            {viewSource ? (
              <CodeBlock value={answer?.text ?? ""} language="markdown" />
            ) : (
              <MarkdownText value={answer?.text ?? ""} />
            )}
          </div>
        )}
        <Flex justify="space-between">
          {(answer === undefined || editing) && (
            <Button
              className="m-1"
              color="primary"
              size="sm"
              onClick={save}
              loading={updating}
              disabled={draftText.trim().length === 0}
              leftIcon={<Icon icon={ICONS.SAVE} />}
            >
              Save
            </Button>
          )}
          {onSectionChanged && (
            <>
              <Button.Group className="m-1">
                {(answer === undefined || editing) && (
                  <IconButton
                    size="sm"
                    onClick={onCancel}
                    iconName={ICONS.CLOSE}
                  >
                    {editing ? "Cancel" : "Delete Draft"}
                  </IconButton>
                )}
                {answer !== undefined && (
                  <Button
                    size="sm"
                    onClick={() => setHasCommentDraft(true)}
                    leftIcon={<Icon icon={ICONS.PLUS} />}
                    disabled={hasCommentDraft}
                  >
                    Add Comment
                  </Button>
                )}
                {answer !== undefined && (
                  <Menu>
                    <Menu.Target>
                      <Button>More</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {answer.flagged === 0 && (
                        <Menu.Item
                          onClick={() => setFlagged(answer.oid, true)}
                        >
                          Flag as Inappropriate
                        </Menu.Item>
                      )}
                      <Menu.Item
                        onClick={() =>
                          copy(
                            `${document.location.origin}/exams/${answer.filename}#${answer.longId}`,
                          )
                        }
                      >
                        Copy Permalink
                      </Menu.Item>
                      {isAdmin && answer.flagged > 0 && (
                        <Menu.Item
                          onClick={() => resetFlagged(answer.oid)}
                        >
                          Remove all inappropriate flags
                        </Menu.Item>
                      )}
                      {!editing && canEdit && (
                        <Menu.Item onClick={startEdit}>
                          Edit
                        </Menu.Item>
                      )}
                      {answer && canRemove && (
                        <Menu.Item onClick={remove}>Delete</Menu.Item>
                      )}
                      <Menu.Item onClick={toggleViewSource}>
                        Toggle Source Code Mode
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Button.Group>
            </>
          )}
        </Flex>

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
      </AnswerWrapper>
    </>
  );
};

export default AnswerComponent;
