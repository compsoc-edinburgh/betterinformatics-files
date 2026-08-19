import {
  Alert,
  Flex,
  Group,
  Tooltip,
  Title,
  useComputedColorScheme,
} from "@mantine/core";
import React, { useMemo } from "react";
import CreateDocumentForm from "./create-document-modal";
import { IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import ShimmerButton from "./shimmer-button";
import { useListDocuments, useListDocumentTypes } from "../api/hooks/documents";
import type { DocumentListSchema } from "../api/model/documentListSchema";
import type { DocumentSchema } from "../api/model/documentSchema";
import {
  DocumentTypeSection,
  EmptyDocumentSection,
} from "./document-type-section";

interface Props {
  slug: string;
}

// Take list of documents and mutate it
// into a record<document-type, documents[]>
function splitDocuments(
  documents: DocumentListSchema,
): Record<string, readonly DocumentSchema[]> {
  const grouped: Record<string, DocumentSchema[]> = {};
  for (const document of documents.value) {
    grouped[document.document_type] ??= [];
    grouped[document.document_type].push(document);
  }

  for (const documents of Object.values(grouped)) {
    documents.sort(
      (a, b) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        b.like_count! - a.like_count! ||
        a.display_name.localeCompare(b.display_name),
    );
  }

  return grouped;
}

const DocumentList: React.FC<Props> = ({ slug }) => {
  const [isOpen, { open, close }] = useDisclosure();
  const documents = useListDocuments({
    category: slug,
  });
  const docTypes = useListDocumentTypes();
  const splitDocs = useMemo(
    () => (documents.isSuccess ? splitDocuments(documents.data) : undefined),
    [documents.isSuccess, documents.data],
  );

  const computedColorScheme = useComputedColorScheme("light");

  return (
    <>
      <CreateDocumentForm isOpen={isOpen} categorySlug={slug} onClose={close} />
      <Title order={2} mt="xl" mb="lg">
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
          <Tooltip label="Upload a new document bundle to share">
            <ShimmerButton
              onClick={open}
              leftSection={<IconPlus />}
              color={computedColorScheme === "dark" ? "compsocMain" : "dark"}
              variant="outline"
            >
              Add Document Bundle
            </ShimmerButton>
          </Tooltip>
        </Group>
      </Flex>
      {documents.isError && (
        <Alert color="red">{documents.error as unknown as string}</Alert>
      )}
      {docTypes.isError && (
        <Alert color="red">{docTypes.error as string}</Alert>
      )}
      {docTypes.isSuccess &&
        docTypes.data.value.map(
          type =>
            splitDocs?.[type] && (
              <DocumentTypeSection
                key={type}
                type={type === "Documents" ? null : type}
                documents={splitDocs[type]}
                refetch={() => void documents.refetch()}
              />
            ),
        )}
      {splitDocs &&
        Object.values(splitDocs).every(docs => docs.length === 0) && (
          <EmptyDocumentSection />
        )}
    </>
  );
};
export default DocumentList;
