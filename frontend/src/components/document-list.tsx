import { Anchor, Button, Flex, Group, Paper, Text, Tooltip } from "@mantine/core";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon, ICONS } from "vseth-canine-ui";
import { useDocuments } from "../api/hooks";
import CreateDocumentForm from "./create-document-modal";
import Grid from "./grid";

interface Props {
  slug: string;
}

const DocumentList: React.FC<Props> = ({ slug }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documents] = useDocuments(slug);
  return (
    <>
      <CreateDocumentForm
        isOpen={isOpen}
        categorySlug={slug}
        toggle={() => setIsOpen(r => !r)}
      />

      <Grid>
        {documents &&
          documents.map(document => (
            <Paper withBorder shadow="md" p="md" key={document.slug}>
              <Anchor
                component={Link}
                to={`/user/${document.author}/document/${document.slug}`}
                size="lg"
                weight={600}
              >
                <Text>{document.display_name}</Text>
              </Anchor>
              <Group position="apart" mt="sm">
                <Anchor
                  component={Link}
                  to={`/user/${document.author}`}
                >
                  <Text color="dimmed">
                    @{document.author}
                  </Text>
                </Anchor>
                {document.liked ? (
                  <Flex align="center" color="red">
                    <Icon icon={ICONS.LIKE_FILLED} color="red" />
                    <Text fw={700} color="red" ml="0.3em">{document.like_count}</Text>
                  </Flex>
                ) : (
                  <Flex align="center">
                    <Icon icon={ICONS.LIKE} />
                    <Text fw={700} ml="0.3em">{document.like_count}</Text>
                  </Flex>
                )}
              </Group>
            </Paper>
          ))}
        <Paper withBorder shadow="md" style={{ minHeight: "6em" }}>
          <Tooltip label="Add a new document">
            <Button
              style={{ width: "100%", height: "100%" }}
              onClick={() => setIsOpen(true)}
            >
              <Icon icon={ICONS.PLUS} size={40} />
            </Button>
          </Tooltip>
        </Paper>
      </Grid>
    </>
  );
};
export default DocumentList;
