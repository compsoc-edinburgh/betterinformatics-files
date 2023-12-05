import { Button, Paper, Tooltip } from "@mantine/core";
import React, { useState } from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { useDocuments } from "../api/hooks";
import CreateDocumentForm from "./create-document-modal";
import Grid from "./grid";
import DocumentCard from "./document-card";

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
            <DocumentCard key={document.slug} document={document} />
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
