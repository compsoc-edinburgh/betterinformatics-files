import React from "react";
import { Document } from "../interfaces";
import { Link } from "react-router-dom";
import { Anchor, Badge, Card, Flex, Group, Text } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import clsx from "clsx";
import classes from "../utils/focus-outline.module.css";

interface DocumentCardProps {
  document: Document;
  showCategory?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  showCategory,
}) => {
  return (
    <Card
      withBorder
      className={clsx(classes.focusOutline, classes.hoverShadow)}
      tabIndex={0}
      key={document.slug}
      p="md"
      component={Link}
      to={`/document/${document.slug}`}
      fw={600}
    >
      <Text size="lg" lineClamp={3}>{document.display_name}</Text>
      <Group justify="space-between" mt="sm">
        {document.anonymised ? (
          <Text c="dimmed">Anonymous</Text>
        ) : (
          <Anchor component={Link} to={`/user/${document.author}`}>
            <Text c="dimmed">@{document.author}</Text>
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
        {showCategory && (
          <Badge ml="xs" component={Link} to={`/category/${document.category}`} c="blue" style={{ cursor: "pointer" }}>
            {document.category_display_name}
          </Badge>
        )}
      </Group>
    </Card>
  );
};

export default DocumentCard;
