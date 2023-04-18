import { Anchor, Button, Group, Paper, Tooltip } from "@mantine/core";
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
            <Paper withBorder p="md" key={document.slug}>
              <Anchor
                weight={600}
                component={Link}
                to={`/user/${document.author}/document/${document.slug}`}
              >
                {document.display_name}
              </Anchor>
              <Group position="apart" mt="sm">
                <Anchor
                  component={Link}
                  to={`/user/${document.author}`}
                  color="dimmed"
                >
                  @{document.author}
                </Anchor>
                {document.liked ? (
                  <span className="text-danger ml-2">
                    <Icon icon={ICONS.LIKE_FILLED} className="mr-1" />{" "}
                    {document.like_count}
                  </span>
                ) : (
                  <span className="text-muted ml-2">
                    <Icon icon={ICONS.LIKE} className="mr-1" />{" "}
                    {document.like_count}
                  </span>
                )}
              </Group>
            </Paper>
          ))}
        <Paper withBorder shadow="md" style={{ minHeight: "4em" }}>
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
