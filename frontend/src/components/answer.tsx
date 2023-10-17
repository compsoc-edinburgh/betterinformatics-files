import { css } from "@emotion/css";
import {
  Button,
  Card,
  Flex,
  Group,
  GroupProps,
  Text,
  Menu,
  Anchor,
  Box,
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
import TooltipButton from "./TooltipButton";

const answerWrapperStyle = css`
  margin-bottom: 1em;
`;

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
      <Card mb="md" withBorder shadow="md" id={hasId ? answer?.longId : undefined} className={answerWrapperStyle}>
        <Card.Section px="md" py="md" withBorder bg="gray.0">
          <Flex justify="space-between" align="center">
            <div>
              {!hasId && (
                <Link
                  to={
                    answer ? `/exams/${answer.filename}#${answer.longId}` : ""
                  }
                >
                  <Text color="dimmed" component="span" >
                    <Icon icon={ICONS.LINK} size="1em" />
                  </Text>
                </Link>
              )}
              {isLegacyAnswer ? (
                answer?.authorDisplayName ?? "(Legacy Draft)"
              ) : (
                <Anchor
                  ml="xs"
                  component={Link}
                  to={`/user/${answer?.authorId ?? username}`}
                >
                  <Text weight={700} component="span">
                    {answer?.authorDisplayName ?? "(Draft)"}
                  </Text>
                  <Text ml="0.3em" color="dimmed" component="span">
                    @{answer?.authorId ?? username}
                  </Text>
                </Anchor>
              )}
              <Text color="dimmed" mx="xs" component="span">
                ·
              </Text>
              {answer && (
                <Text color="dimmed" component="span" title={answer.time}>
                  {formatDistanceToNow(new Date(answer.time))} ago
                </Text>
              )}
              {answer &&
                differenceInSeconds(
                  new Date(answer.edittime),
                  new Date(answer.time),
                ) > 1 && (
                  <>
                    <Text color="dimmed" mx="xs" component="span">
                      ·
                    </Text>
                    <Text
                      color="dimmed"
                      component="span"
                      title={answer.edittime}
                    >
                      edited {formatDistanceToNow(new Date(answer.edittime))}{" "}
                      ago
                    </Text>
                  </>
                )}
            </div>
            <Flex>
              <AnswerToolbar>
                {answer &&
                  (answer.expertvotes > 0 ||
                    setExpertVoteLoading ||
                    isExpert) && (
                    <Button.Group>
                      <TooltipButton
                        px={8}
                        size="sm"
                        tooltip="This answer is endorsed by an expert"
                        variant="filled"
                        color="yellow"
                      >
                        <Icon icon={ICONS.STAR_FILLED} size={18} />
                      </TooltipButton>
                      <SmallButton tooltip={`${answer.expertvotes} experts endorse this answer.`}>
                        {answer.expertvotes}
                      </SmallButton>
                      {isExpert && (
                        <TooltipButton
                          color="primary"
                          size="sm"
                          px={8}
                          loading={setExpertVoteLoading}
                          tooltip={
                            answer.isExpertVoted
                              ? "Remove expert vote"
                              : "Add expert vote"
                          }
                          onClick={() =>
                            setExpertVote(answer.oid, !answer.isExpertVoted)
                          }
                        >
                          <Icon icon={answer.isExpertVoted ? ICONS.MINUS : ICONS.PLUS} />
                        </TooltipButton>
                      )}
                    </Button.Group>
                  )}
                {answer &&
                  (answer.isFlagged ||
                    (answer.flagged > 0 && isAdmin) ||
                    flaggedLoading) && (
                    <Button.Group>
                      <Button
                        color="red"
                        leftIcon={<Icon icon={ICONS.FLAG} />}
                        title="Flagged as Inappropriate"
                      >
                        Inappropriate
                      </Button>
                      <SmallButton
                        color="red"
                        tooltip={`${answer.flagged} users consider this answer inappropriate.`}
                      >
                        {answer.flagged}
                      </SmallButton>
                      <TooltipButton
                        px={4}
                        tooltip={
                          answer.isFlagged
                            ? "Remove inappropriate flag"
                            : "Add inappropriate flag"
                        }
                        size="sm"
                        loading={flaggedLoading}
                        onClick={() =>
                          setFlagged(answer.oid, !answer.isFlagged)
                        }
                      >
                        <Icon icon={answer.isFlagged ? ICONS.MINUS : ICONS.PLUS} size={18} />
                      </TooltipButton>
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
            </Flex>
          </Flex>
        </Card.Section>
        {editing || answer === undefined ? (
          <Card.Section>
            <Box p="md">
              <Editor
                value={draftText}
                onChange={setDraftText}
                imageHandler={imageHandler}
                preview={value => <MarkdownText value={value} />}
                undoStack={undoStack}
                setUndoStack={setUndoStack}
              />
              <Text mt="xs" color="dimmed">
                Your answer will be licensed as{" "}
                <Link to="https://creativecommons.org/licenses/by-nc-sa/4.0/">
                  CC BY-NC-SA 4.0
                </Link>
                .
              </Text>
            </Box>
          </Card.Section>
        ) : (
          <Card.Section>
            <Box p="md">
              {viewSource ? (
                <CodeBlock value={answer?.text ?? ""} language="markdown" />
              ) : (
                <MarkdownText value={answer?.text ?? ""} />
              )}
            </Box>
          </Card.Section>
        )}
        <Group position="right">
          {(answer === undefined || editing) && (
            <Button
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
            <Flex align="center">
              {(answer === undefined || editing) && (
                <IconButton
                  size="sm"
                  onClick={onCancel}
                  iconName={ICONS.CLOSE}
                >
                  {editing ? "Cancel" : "Delete Draft"}
                </IconButton>
              )}
              <Button.Group ml="md">
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
                      <Button leftIcon={<Icon icon={ICONS.DOTS_H} />}>More</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {answer.flagged === 0 && (
                        <Menu.Item onClick={() => setFlagged(answer.oid, true)}>
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
                        <Menu.Item onClick={() => resetFlagged(answer.oid)}>
                          Remove all inappropriate flags
                        </Menu.Item>
                      )}
                      {!editing && canEdit && (
                        <Menu.Item onClick={startEdit}>Edit</Menu.Item>
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
            </Flex>
          )}
        </Group>

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
      </Card>
    </>
  );
};

export default AnswerComponent;
