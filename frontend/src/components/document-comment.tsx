import {
  Anchor,
  Button,
  Card,
  Divider,
  Flex,
  Loader,
  Modal,
  Text,
} from "@mantine/core";
import { differenceInSeconds } from "date-fns";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { usePendingImages } from "./Editor/pending-images";
import { useUser } from "../auth";
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
import displayNameClasses from "../utils/display-name.module.css";
import { copy } from "../utils/clipboard";
import {
  useDeleteDocumentComment,
  useResetCommentMarkedAsAi,
  useResetFlaggedComment,
  useSetCommentMarkedAsAi,
  useSetFlaggedComment,
  useUpdateDocumentComment,
} from "../api/hooks/documents";
import type { DocumentCommentSchema } from "../api/model/documentCommentSchema";

const Editor = lazy(() => import("./Editor"));

interface Props {
  documentSlug: string;
  comment: DocumentCommentSchema;
  refetch: () => void;
}
const DocumentCommentComponent = ({ documentSlug, comment, refetch }: Props) => {
  const { isAdmin, username } = useUser()!;

  const updateComment = useUpdateDocumentComment({
    mutation: {
      onSuccess() {
        setHasDraft(false);
        refetch();
      },
    },
  });

  const hooksOptionsRefetch = {
    mutation: {
      onSuccess() {
        refetch();
      },
    },
  };

  const deleteComment = useDeleteDocumentComment(hooksOptionsRefetch);

  const [hasDraft, setHasDraft] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const { deferredImageHandler, flushPendingImages, pendingObjectUrls } =
    usePendingImages();
  const toggle = () => setHasDraft(e => !e);

  const setCommentFlagged = useSetFlaggedComment(hooksOptionsRefetch);
  const setCommentMarkedAsAi = useSetCommentMarkedAsAi(hooksOptionsRefetch);
  const resetCommentFlagged = useResetFlaggedComment(hooksOptionsRefetch);
  const resetCommentMarkedAsAi = useResetCommentMarkedAsAi(hooksOptionsRefetch);

  const flaggedLoading =
    setCommentFlagged.isPending || resetCommentFlagged.isPending;
  const isOwnComment = comment.authorId === username;

  return (
    <div id={String(comment.oid)}>
      <Modal title="Edit comment" onClose={toggle} opened={hasDraft} size="lg">
        <Modal.Body>
          <Suspense fallback={<Loader />}>
            <Editor
              value={draftText}
              onChange={setDraftText}
              imageHandler={deferredImageHandler}
              preview={value => (
                <MarkdownText value={value} pendingImages={pendingObjectUrls} />
              )}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
            />
            <TooltipButton
              mt="sm"
              tooltip="Save comment"
              disabled={updateComment.isPending || draftText.length === 0}
              onClick={async () => {
                const text = await flushPendingImages(draftText);
                updateComment.mutate({
                  slug: documentSlug,
                  id: comment.oid,
                  data: {
                    text,
                  },
                });
              }}
            >
              Save
            </TooltipButton>
          </Suspense>
        </Modal.Body>
      </Modal>
      <Card withBorder shadow="md" my="sm">
        <Card.Section mb="sm">
          <Flex py="sm" px="md" justify="space-between" align="center">
            <div>
              <Flex align="center">
                <Anchor
                  component={Link}
                  to={`/user/${comment.authorId}`}
                  className={displayNameClasses.shrinkableDisplayName}
                >
                  <Text fw={700} component="span">
                    {comment.authorDisplayName}
                  </Text>
                  <TimeText time={comment.time} suffix="ago" />
                  {differenceInSeconds(
                    new Date(comment.edittime),
                    new Date(comment.time),
                  ) > 1 && (
                    <>
                      <Text component="span" c="dimmed" mx={6}>
                        ·
                      </Text>
                      <TimeText
                        time={comment.edittime}
                        prefix="edited"
                        suffix="ago"
                      />
                    </>
                  )}
                </Anchor>
              </Flex>
              <MarkedAsAiBadge count={comment.markedAsAiCount} />
            </div>
            <Flex>
              <FlaggedBadge
                count={comment.flaggedCount}
                isFlagged={comment.isFlagged}
                loading={flaggedLoading}
                size="xs"
                onToggle={
                  isOwnComment
                    ? undefined
                    : () =>
                        setCommentFlagged.mutate({
                          id: comment.oid,
                          data: {
                            flagged: !comment.isFlagged,
                          },
                        })
                }
              />
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
                  {!isOwnComment && (
                    <>
                      <SmallButton
                        tooltip={
                          comment.isMarkedAsAi
                            ? "Remove AI-generated mark"
                            : "Mark as AI-generated"
                        }
                        size="xs"
                        color="white"
                        onClick={() =>
                          setCommentMarkedAsAi.mutate({
                            id: comment.oid,
                            data: {
                              marked_as_ai: !comment.isMarkedAsAi,
                            },
                          })
                        }
                      >
                        {comment.isMarkedAsAi ? (
                          <IconRobotOff />
                        ) : (
                          <IconRobot />
                        )}
                      </SmallButton>
                      <SmallButton
                        tooltip="Flag as inappropriate"
                        size="xs"
                        color="white"
                        onClick={() =>
                          setCommentFlagged.mutate({
                            id: comment.oid,
                            data: {
                              flagged: !comment.isFlagged,
                            },
                          })
                        }
                      >
                        <IconFlag />
                      </SmallButton>
                    </>
                  )}
                  <SmallButton
                    tooltip="Copy Permalink"
                    size="xs"
                    color="white"
                    onClick={() =>
                      copy(
                        `${document.location.origin}/document/${documentSlug}?comment=${comment.oid}`,
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
                          onClick={() =>
                            resetCommentFlagged.mutate({
                              id: comment.oid,
                            })
                          }
                        >
                          <IconFlagCancel />
                        </SmallButton>
                      )}
                      {comment.markedAsAiCount > 0 && (
                        <SmallButton
                          tooltip="Remove all AI-generated marks"
                          size="xs"
                          color="white"
                          onClick={() =>
                            resetCommentMarkedAsAi.mutate({
                              id: comment.oid,
                            })
                          }
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
                        onClick={() =>
                          deleteComment.mutate({
                            slug: documentSlug,
                            id: comment.oid,
                          })
                        }
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
