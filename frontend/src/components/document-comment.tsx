import {
  Anchor,
  Button,
  Card,
  Divider,
  Flex,
  Modal,
  Paper,
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
  useSetDocumentCommentFlagged,
  useUpdateDocumentComment,
} from "../api/hooks";
import { useUser } from "../auth";
import { Document, DocumentComment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import SmallButton from "./small-button";
import TooltipButton from "./TooltipButton";
import { IconChevronUp, IconEdit, IconFlag, IconFlagCancel, IconLink, IconTrash, IconX } from "@tabler/icons-react";
import TimeText from "./time-text";
import { copy } from "../utils/clipboard";

interface Props {
  documentAuthor: string;
  documentSlug: string;
  comment: DocumentComment;
  mutate: Mutate<Document>;
  reload: () => void;
}
const DocumentCommentComponent = ({
  documentAuthor,
  documentSlug,
  comment,
  mutate,
  reload,
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
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const toggle = () => setHasDraft(e => !e);

  const [setCommentFlaggedLoading, setCommentFlagged] = useSetDocumentCommentFlagged(reload);
  const [resetCommentFlaggedLoading, resetCommentFlagged] = useResetDocumentCommentFlaggedVote(reload);

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
              {comment && (
                <TimeText time={comment.time} suffix="ago" />
              )}
              {comment &&
                differenceInSeconds(
                  new Date(comment.edittime),
                  new Date(comment.time),
                ) > 1 && (
                  <>
                    <Text component="span" color="dimmed" mx={6}>
                      ·
                    </Text>
                    <TimeText time={comment.edittime} prefix="edited" suffix="ago" />
                  </>
                )}
            </Flex>
            <Flex>
              {comment &&
              (comment.isFlagged ||
                (comment.flaggedCount > 0 && isAdmin) ||
                flaggedLoading) && (
                <Paper shadow="xs" mr="md">
                  <Button.Group>
                    <TooltipButton
                      tooltip="Flagged as Inappropriate"
                      color="red"
                      px={12}
                      variant="filled"
                      size="xs"
                    >
                      <IconFlag />
                    </TooltipButton>
                    <TooltipButton
                      color="red"
                      miw={30}
                      tooltip={`${comment.flaggedCount} users consider this answer inappropriate.`}
                      size="xs"
                    >
                      {comment.flaggedCount}
                    </TooltipButton>
                    <TooltipButton
                      px={8}
                      tooltip={
                        comment.isFlagged
                          ? "Remove inappropriate flag"
                          : "Add inappropriate flag"
                      }
                      size="xs"
                      loading={flaggedLoading}
                      style={{ borderLeftWidth: 0 }}
                      onClick={() =>
                        setCommentFlagged(comment.oid, !comment.isFlagged)
                      }
                    >
                      {comment.isFlagged ? <IconX /> : <IconChevronUp />}
                    </TooltipButton>
                  </Button.Group>
                </Paper>
              )}
              <Button.Group>
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
                  <SmallButton
                    tooltip="Remove all inappropriate flags"
                    size="xs"
                    color="white"
                    onClick={() =>
                      resetCommentFlagged(comment.oid)
                    }>
                      <IconFlagCancel />
                    </SmallButton>
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
            </Flex>
          </Flex>
          <Divider/>
        </Card.Section>
        <MarkdownText value={comment.text} />
      </Card>
    </div>
  );
};

export default DocumentCommentComponent;
