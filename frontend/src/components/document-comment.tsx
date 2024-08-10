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
  useUpdateDocumentComment,
} from "../api/hooks";
import { useUser } from "../auth";
import { Document, DocumentComment } from "../interfaces";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import SmallButton from "./small-button";
import TooltipButton from "./TooltipButton";
import { IconEdit, IconTrash } from "@tabler/icons-react";

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
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });
  const toggle = () => setHasDraft(e => !e);
  return (
    <>
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
                <Text component="span" color="dimmed" title={comment.time}>
                  {formatDistanceToNow(new Date(comment.time))} ago
                </Text>
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
                    <Text
                      component="span"
                      color="dimmed"
                      title={comment.edittime}
                    >
                      edited {formatDistanceToNow(new Date(comment.edittime))}{" "}
                      ago
                    </Text>
                  </>
                )}
            </Flex>
            {(comment.canEdit || isAdmin) && (
              <Button.Group>
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
              </Button.Group>
            )}
          </Flex>
          <Divider/>
        </Card.Section>
        <MarkdownText value={comment.text} />
      </Card>
    </>
  );
};

export default DocumentCommentComponent;
