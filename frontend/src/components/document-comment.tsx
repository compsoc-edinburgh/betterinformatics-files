import {
  Anchor,
  Button,
  Card,
  Divider,
  Flex,
  Modal,
  Text,
} from "@mantine/core";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Link } from "react-router-dom";
import { imageHandler } from "../api/fetch-utils";
import {
  Mutate,
  useDeleteDocumentComment,
  useResetDocumentCommentFlaggedVote,
  useResetDocumentCommentMarkedAsAi,
  useSetDocumentCommentFlagged,
  useSetDocumentCommentMarkedAsAi,
  useUpdateDocumentComment,
} from "../api/hooks";
import { useUser } from "../auth";
import { Document, DocumentComment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import SmallButton from "./small-button";
import TooltipButton from "./TooltipButton";
import {
  IconChevronDown,
  IconEdit,
  IconFlag,
  IconFlagCancel,
  IconLink,
  IconRobot,
  IconRobotOff,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import FlaggedBadge from "./FlaggedBadge";
import MarkedAsAiBadge from "./MarkedAsAiBadge";
import TimeText from "./time-text";
import { copy } from "../utils/clipboard";

interface Props {
  documentAuthor: string;
  documentSlug: string;
  comment: DocumentComment;
  mutate: Mutate<Document>;
}
const DocumentCommentComponent = ({
  documentAuthor,
  documentSlug,
  comment,
  mutate,
}: Props) => {
  const { isAdmin } = useUser()!;
  const [editLoading, updateComment] = useUpdateDocumentComment(
    documentAuthor,
    documentSlug,
    comment.oid,
    res => {
      setHasDraft(false);
      mutate(document => ({
        ...document,
        comments: document.comments.map(c => (c.oid !== res.oid ? c : res)),
      }));
    },
  );
  const [_, deleteComment] = useDeleteDocumentComment(
    documentAuthor,
    documentSlug,
    comment.oid,
    () =>
      mutate(document => ({
        ...document,
        comments: document.comments.filter(c => c.oid !== comment.oid),
      })),
  );
  const [hasDraft, setHasDraft] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const toggle = () => setHasDraft(e => !e);

  const mutateComment = (res: DocumentComment) =>
    mutate(document => ({
      ...document,
      comments: document.comments.map(c => (c.oid !== res.oid ? c : res)),
    }));

  const [setCommentFlaggedLoading, setCommentFlagged] =
    useSetDocumentCommentFlagged(mutateComment);
  const [, setCommentMarkedAsAi] =
    useSetDocumentCommentMarkedAsAi(mutateComment);
  const [resetCommentFlaggedLoading, resetCommentFlagged] =
    useResetDocumentCommentFlaggedVote(mutateComment);
  const [, resetCommentMarkedAsAi] =
    useResetDocumentCommentMarkedAsAi(mutateComment);

  const flaggedLoading = setCommentFlaggedLoading || resetCommentFlaggedLoading;

  return (
    <div id={String(comment.oid)}>
      <Modal title="Edit comment" onClose={toggle} opened={hasDraft} size="lg">
        <Modal.Body>
          <Editor
            value={draftText}
            onChange={setDraftText}
            imageHandler={imageHandler}
            preview={value => <MarkdownText value={value} />}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
          />
          <TooltipButton
            mt="sm"
            tooltip="Save comment"
            disabled={editLoading || draftText.length === 0}
            onClick={() => updateComment(draftText)}
          >
            Save
          </TooltipButton>
        </Modal.Body>
      </Modal>
      <Card withBorder shadow="md" my="sm">
        <Card.Section mb="sm">
          <Flex py="sm" px="md" justify="space-between" align="center">
            <div>
              <Flex align="center">
                <Anchor component={Link} to={`/user/${comment.authorId}`}>
                  <Text fw={700} component="span">
                    {comment.authorDisplayName}
                  </Text>
                  <Text ml="0.25em" color="dimmed" component="span">
                    @{comment.authorId}
                  </Text>
                </Anchor>
                <Text component="span" mx={6} color="dimmed">
                  ·
                </Text>
                {comment && <TimeText time={comment.time} suffix="ago" />}
                {comment &&
                  differenceInSeconds(
                    new Date(comment.edittime),
                    new Date(comment.time),
                  ) > 1 && (
                    <>
                      <Text component="span" color="dimmed" mx={6}>
                        ·
                      </Text>
                      <TimeText
                        time={comment.edittime}
                        prefix="edited"
                        suffix="ago"
                      />
                    </>
                  )}
              </Flex>
              <MarkedAsAiBadge count={comment.markedAsAiCount} />
            </div>
            <Flex>
              {comment && (
                <FlaggedBadge
                  count={comment.flaggedCount}
                  isFlagged={comment.isFlagged}
                  loading={flaggedLoading}
                  size="xs"
                  onToggle={() =>
                    setCommentFlagged(comment.oid, !comment.isFlagged)
                  }
                />
              )}
              <SmallButton
                tooltip={showActions ? "Hide actions" : "Show actions"}
                size="xs"
                variant="outline"
                onClick={() => setShowActions(value => !value)}
              >
                {showActions ? <IconX /> : <IconChevronDown />}
              </SmallButton>
              {showActions && (
                <Button.Group>
                  <SmallButton
                    tooltip={
                      comment.isMarkedAsAi
                        ? "Remove AI-generated mark"
                        : "Mark as AI-generated"
                    }
                    size="xs"
                    color="white"
                    onClick={() =>
                      setCommentMarkedAsAi(comment.oid, !comment.isMarkedAsAi)
                    }
                  >
                    {comment.isMarkedAsAi ? <IconRobotOff /> : <IconRobot />}
                  </SmallButton>
                  <SmallButton
                    tooltip="Flag as inappropriate"
                    size="xs"
                    color="white"
                    onClick={() =>
                      setCommentFlagged(comment.oid, !comment.isFlagged)
                    }
                  >
                    <IconFlag />
                  </SmallButton>
                  <SmallButton
                    tooltip="Copy Permalink"
                    size="xs"
                    color="white"
                    onClick={() =>
                      copy(
                        `${document.location.origin}/user/${documentAuthor}/document/${documentSlug}?comment=${comment.oid}`,
                      )
                    }
                  >
                    <IconLink />
                  </SmallButton>
                  {isAdmin && (
                    <>
                      {comment.flaggedCount > 0 && (
                        <SmallButton
                          tooltip="Remove all inappropriate flags"
                          size="xs"
                          color="white"
                          onClick={() => resetCommentFlagged(comment.oid)}
                        >
                          <IconFlagCancel />
                        </SmallButton>
                      )}
                      {comment.markedAsAiCount > 0 && (
                        <SmallButton
                          tooltip="Remove all AI-generated marks"
                          size="xs"
                          color="white"
                          onClick={() => resetCommentMarkedAsAi(comment.oid)}
                        >
                          <IconRobotOff />
                        </SmallButton>
                      )}
                    </>
                  )}
                  {(comment.canEdit || isAdmin) && (
                    <>
                      <SmallButton
                        tooltip="Delete comment"
                        size="xs"
                        color="white"
                        onClick={deleteComment}
                      >
                        <IconTrash />
                      </SmallButton>
                      <SmallButton
                        tooltip="Edit comment"
                        size="xs"
                        color="white"
                        onClick={() => {
                          toggle();
                          setDraftText(comment.text);
                          setUndoStack({
                            prev: [],
                            next: [],
                          });
                        }}
                      >
                        <IconEdit />
                      </SmallButton>
                    </>
                  )}
                </Button.Group>
              )}
            </Flex>
          </Flex>
          <Divider />
        </Card.Section>
        <MarkdownText value={comment.text} />
      </Card>
    </div>
  );
};

export default DocumentCommentComponent;
