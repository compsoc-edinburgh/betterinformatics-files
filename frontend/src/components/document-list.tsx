import { Button, Paper, Tooltip, Title } from "@mantine/core";
import React, { useEffect, useState, useMemo } from "react";
import { Icon, ICONS } from "vseth-canine-ui";
import { loadDocumentTypes, useDocuments } from "../api/hooks";
import CreateDocumentForm from "./create-document-modal";
import Grid from "./grid";
import DocumentCard from "./document-card";
import { Document } from "../interfaces";

interface Props {
  slug: string;
}

const DocumentList: React.FC<Props> = ({ slug }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documents] = useDocuments(slug);
  const [docTypes, setDocTypes] = useState<string[] | null>(null);
  const [sortedDocs, setSortedDocs] = useState<
    { type: string; docs: Document[] }[]
  >([]);
  useEffect(() => {
    async function temp() {
      setDocTypes(await loadDocumentTypes());
    }
    temp();
  }, []);
  useEffect(() => {
    const currentDocTypes: { type: string; docs: Document[] }[] = [];
    if (docTypes === null) {
      return;
    }
    if (documents === undefined) {
      return;
    }
    for (const dType of docTypes) {
      const typelist = documents.filter(
        document => document.document_type == dType,
      );
      typelist.sort((a, b) => b.like_count - a.like_count);
      currentDocTypes.push({ type: dType, docs: typelist });
    }
    currentDocTypes.push({ type: "Add files", docs: [] });
    setSortedDocs(currentDocTypes);
  }, [docTypes, documents]);
  return (
    <>
      <CreateDocumentForm
        isOpen={isOpen}
        categorySlug={slug}
        toggle={() => setIsOpen(r => !r)}
      />

      {sortedDocs &&
        sortedDocs.map(obj => (
          <>
            <Title order={3} mt="xl" mb="lg">
              {obj.type}
            </Title>
            <Grid>
              {obj.type === "Add files" ? (
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
              ) : (
                obj.docs &&
                obj.docs.map(document => (
                  <DocumentCard key={document.slug} document={document} />
                ))
              )}
            </Grid>
          </>
        ))}
    </>
  );
};
export default DocumentList;
