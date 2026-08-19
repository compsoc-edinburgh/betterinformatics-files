import React from "react";
import { DocumentSchema } from "../api/model";
import { Box, Title, Text, Anchor, Flex, Stack } from "@mantine/core";
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
            <Stack gap={0} className={documentTypeClasses.documentLink}>
              <Anchor component={Link} to={`/document/${document.slug}`}>
                <Text size="md">{document.display_name}</Text>
              </Anchor>
              <Text c="dimmed">
                {document.anonymised
                  ? "Anonymous"
                  : `@${document.author.username}`}
              </Text>
            </Stack>
            {document.edittime ? (
              <Text c="dimmed" component="span" size="xs" ta="right">
                Last updated {formatDistanceToNow(new Date(document.edittime))}{" "}
                ago
              </Text>
            ) : (
              <div />
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
