import React from "react";
import { DocumentSchema } from "../api/model";
import { Title, Text, Anchor, Group, Button, Tooltip } from "@mantine/core";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Link } from "react-router-dom";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useUpdateDocument } from "../api/hooks/documents";
import {
  ResourceList,
  ResourceListEmptyRow,
  ResourceListRow,
  ResourceListTitle,
} from "./resource-list";

export const DocumentTypeSection: React.FC<{
  type: string | null;
  documents: readonly DocumentSchema[];
  refetch: () => void;
}> = ({ type, documents, refetch }) => {
  const { mutate: likeDocument } = useUpdateDocument({
    mutation: {
      onSuccess: refetch,
    },
  });
  return (
    <>
      {type && (
        <Title order={3} mt="xl" mb="lg">
          {type}
        </Title>
      )}
      <ResourceList columns="1fr auto auto">
        {documents.map(document => (
          <ResourceListRow key={document.slug}>
            <ResourceListTitle direction="row" gap="xs">
              <Anchor component={Link} to={`/document/${document.slug}`}>
                <Text size="md">{document.display_name}</Text>
              </Anchor>
              <Text c="dimmed">
                {document.anonymised
                  ? "(Anonymous)"
                  : `(@${document.author.username})`}
              </Text>
            </ResourceListTitle>
            {document.edittime ? (
              <Text
                c="dimmed"
                component="span"
                size="xs"
                ta="right"
                display={{ base: "none", sm: "block" }}
              >
                Last updated {formatDistanceToNow(new Date(document.edittime))}{" "}
                ago
              </Text>
            ) : (
              <div />
            )}
            <Tooltip
              label={document.liked ? "Remove your mark" : "Mark as liked"}
            >
              <Button
                variant="transparent"
                c={
                  document.liked
                    ? "var(--mantine-color-red-filled)"
                    : "currentcolor"
                }
                onClick={() =>
                  likeDocument({
                    slug: document.slug,
                    data: {
                      liked: !document.liked,
                    },
                  })
                }
                justify="flex-end"
                pl={0}
              >
                <Group gap="xs" wrap="nowrap">
                  {document.like_count?.toString()}
                  {document.liked ? <IconHeartFilled /> : <IconHeart />}
                </Group>
              </Button>
            </Tooltip>
          </ResourceListRow>
        ))}
      </ResourceList>
    </>
  );
};

export const EmptyDocumentSection: React.FC = () => {
  return (
    <ResourceList columns="1fr">
      <ResourceListEmptyRow>
        No documents found. Upload your own to share! We welcome cheatsheets,
        study notes, algorithm implementations, Anki decks, and more. If you
        would like to write more freestyle, consider also adding to the course
        guide.
      </ResourceListEmptyRow>
    </ResourceList>
  );
};
