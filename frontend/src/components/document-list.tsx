import { Alert, Flex, Group, Tooltip, Title, useComputedColorScheme } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { loadDocumentTypes, useDocuments } from "../api/hooks";
import CreateDocumentForm from "./create-document-modal";
import Grid from "./grid";
import DocumentCard from "./document-card";
import { Document } from "../interfaces";
import { IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import ShimmerButton from "./shimmer-button";

interface Props {
  slug: string;
}

const DocumentList: React.FC<Props> = ({ slug }) => {
  const [isOpen, { open, close }] = useDisclosure();
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
      docs.sort(
        (a, b) =>
          b.like_count - a.like_count ||
          a.display_name.localeCompare(b.display_name),
      ),
    );
    setSortedDocs(
      Array.from(currentDocTypes, ([type, docs]) => ({ type, docs })).filter(
        value => value.docs.length > 0,
      ),
    );
  }, [docTypes, documents]);

  const computedColorScheme = useComputedColorScheme("light");

  return (
    <>
      <CreateDocumentForm
        isOpen={isOpen}
        categorySlug={slug}
        onClose={close}
      />
      <Title
        order={2}
        mt="xl"
        mb={sortedDocs[0] && sortedDocs[0].docs.length && "lg"}
      >
        Community Documents
      </Title>
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap="sm"
        mt="sm"
        mb="lg"
        justify="space-between"
      >
        <Group>
          <Tooltip label="Upload a new document to share">
            <ShimmerButton
              onClick={open}
              leftSection={<IconPlus />}
              color={computedColorScheme === "dark" ? "compsocMain" : "dark"}
              variant="outline"
            >
              Add document
            </ShimmerButton>
          </Tooltip>
        </Group>
      </Flex>
      {sortedDocs &&
        sortedDocs.map(obj => (
          <React.Fragment key={obj.type}>
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
          </React.Fragment>
        ))}
      {sortedDocs && sortedDocs.length === 0 && (
        <Alert variant="light" color="orange">
          No community documents yet. Upload your own to share! Cheatsheets,
          study notes, code implementations of algorithms, Anki decks, and more
          are all welcome.
        </Alert>
      )}
    </>
  );
};
export default DocumentList;
