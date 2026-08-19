import React from "react";
import { DocumentSchema } from "../api/model";
import { Box, Title, Text, Anchor, Flex } from "@mantine/core";
import documentTypeClasses from "./document-type-section.module.css";
import fadeClasses from "../utils/fade-in-order.module.css";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Link } from "react-router-dom";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

export const DocumentTypeSection: React.FC<{
  type: string | null;
  documents: readonly DocumentSchema[];
}> = ({ type, documents }) => {
  return (
    <>
      {type && (
        <Title order={3} mt="xl" mb="lg">
          {type}
        </Title>
      )}
      <Box className={documentTypeClasses.documentTable}>
        {documents.map(document => (
          <Box
            key={document.slug}
            className={clsx(
              documentTypeClasses.documentRow,
              fadeClasses.fadeInOrder,
            )}
          >
            <Anchor
              component={Link}
              to={`/document/${document.slug}`}
              className={documentTypeClasses.documentLink}
            >
              <Text size="md">{document.display_name}</Text>
            </Anchor>
            {document.edittime ? (
              <Text c="dimmed" component="span" size="xs">
                Last updated {formatDistanceToNow(new Date(document.edittime))}{" "}
                ago
              </Text>
            ) : (
              <div />
            )}
            {document.anonymised ? (
              <Text c="dimmed">Anonymous</Text>
            ) : (
              <Anchor
                component={Link}
                to={`/user/${document.author.username}`}
                c="dimmed"
              >
                @{document.author.username}
              </Anchor>
            )}
            {document.liked ? (
              <Flex align="center" color="red">
                <IconHeartFilled color="red" />
                <Text fw={700} c="red" ml="0.3em">
                  {document.like_count}
                </Text>
              </Flex>
            ) : (
              <Flex align="center">
                <IconHeart />
                <Text fw={700} ml="0.3em">
                  {document.like_count}
                </Text>
              </Flex>
            )}
          </Box>
        ))}
      </Box>
    </>
  );
};
