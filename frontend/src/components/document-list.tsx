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
    (async () => {
      setDocTypes(await loadDocumentTypes());
    })();
  }, []);
  useEffect(() => {
    const currentDocTypes = new Map<string, Document[]>();
    if (!docTypes || documents === undefined) {
      return;
    }
    docTypes.forEach(type => currentDocTypes.set(type, []));
    documents.forEach(doc => currentDocTypes.get(doc.document_type)?.push(doc));
    currentDocTypes.forEach(docs =>
      docs.sort((a, b) => b.like_count - a.like_count),
    );
    setSortedDocs(
      Array.from(currentDocTypes, ([type, docs]) => ({ type, docs })).filter(
        value => value.docs.length > 0,
      ),
    );
  }, [docTypes, documents]);
  return (
    <>
      <CreateDocumentForm
        isOpen={isOpen}
        categorySlug={slug}
        toggle={() => setIsOpen(r => !r)}
      />
      <Title
        order={2}
        mt="xl"
        mb={sortedDocs[0] && sortedDocs[0].docs.length && "lg"}
      >
        Documents
      </Title>
      {sortedDocs &&
        sortedDocs.map(obj => (
          <>
            {obj.type !== "Documents" && (
              <Title order={3} mt="xl" mb="lg">
                {obj.type}
              </Title>
            )}
            <Grid>
              {obj.docs &&
                obj.docs.map(document => (
                  <DocumentCard key={document.slug} document={document} />
                ))}
            </Grid>
          </>
        ))}
      <Title order={3} mt="xl" mb="lg">
        Add Documents
      </Title>
      <Grid>
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
