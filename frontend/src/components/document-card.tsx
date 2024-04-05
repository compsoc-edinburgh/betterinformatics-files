import React from "react";
import { Document } from "../interfaces";
import { Link } from "react-router-dom";
import { Anchor, Badge, Flex, Group, Paper, Text } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

interface DocumentCardProps {
  document: Document;
  showCategory?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  showCategory,
}) => {
  return (
    <Paper withBorder shadow="md" p="md" key={document.slug}>
      <Anchor
        component={Link}
        to={`/user/${document.author}/document/${document.slug}`}
        size="lg"
        fw={600}
      >
        <Text>{document.display_name}</Text>
      </Anchor>
      <Group justify="space-between" mt="sm">
        <Anchor component={Link} to={`/user/${document.author}`}>
          <Text color="dimmed">@{document.author}</Text>
        </Anchor>
        {document.liked ? (
          <Flex align="center" color="red">
            <IconHeartFilled color="red" />
            <Text fw={700} color="red" ml="0.3em">
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
        {showCategory && (
          <Badge ml="xs">
            <Anchor
              component={Link}
              color="blue"
              to={`/category/${document.category}`}
            >
              {document.category_display_name}
            </Anchor>
          </Badge>
        )}
      </Group>
    </Paper>
  );
};

export default DocumentCard;
