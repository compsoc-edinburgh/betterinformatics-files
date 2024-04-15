import {
  Button,
  List,
  TextInput,
  Modal,
  Flex,
  Title,
  Text,
  Stack,
  Group,
  Select,
  Grid,
} from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { imageHandler } from "../api/fetch-utils";
import {
  loadCategories,
  loadDocumentTypes,
  Mutate,
  useDeleteDocument,
  useRegenerateDocumentAPIKey,
  useUpdateDocument,
} from "../api/hooks";
import { Document } from "../interfaces";
import { createOptions, options } from "../utils/ts-utils";
import CreateDocumentFileModal from "./create-document-file-modal";
import DocumentFileItem from "./document-file-item";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";
import {
  IconDeviceFloppy,
  IconPlus,
  IconReload,
  IconTrash,
} from "@tabler/icons-react";
import Creatable from "./creatable";
import { useDisclosure } from "@mantine/hooks";

interface Props {
  data: Document;
  mutate: Mutate<Document>;
}

const DocumentSettings: React.FC<Props> = ({ data, mutate }) => {
  const history = useHistory();
  const { data: categories } = useRequest(loadCategories);
  const categoryOptions =
    categories &&
    createOptions(
      Object.fromEntries(
        categories.map(
          category => [category.slug, category.displayname] as const,
        ),
      ) as { [key: string]: string },
    );

  const { data: documentTypes } = useRequest(loadDocumentTypes);

  const [documentTypeOptions, setDocumentTypeOptions] = useState<string[]>([]);
  useEffect(() => {
    setDocumentTypeOptions(documentTypes ?? []);
  }, [documentTypes]);

  const [loading, updateDocument] = useUpdateDocument(
    data.author,
    data.slug,
    result => {
      mutate(s => ({ ...s, ...result }));
      setDisplayName(undefined);
      setCategory(undefined);
      setDocumentType(undefined);
      if (result.slug !== data.slug) {
        history.replace(`/user/${result.author}/document/${result.slug}`);
      }
    },
  );
  const [regenerateLoading, regenerate] = useRegenerateDocumentAPIKey(
    data.author,
    data.slug,
    result => mutate(s => ({ ...s, ...result })),
  );
  const [_, deleteDocument] = useDeleteDocument(
    data.author,
    data.slug,
    () => data && history.push(`/category/${data.category}`),
  );
  const [deleteModalIsOpen, {toggle: toggleDeleteModalIsOpen, close: closeDeleteModal}] = useDisclosure();

  const [displayName, setDisplayName] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [documentType, setDocumentType] = useState<string | undefined>();
  const [descriptionDraftText, setDescriptionDraftText] = useState<
    string | undefined
  >(undefined);
  const [descriptionUndoStack, setDescriptionUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });

  const [addModalIsOpen, {toggle: toggleAddModalIsOpen, open: openAddModal, close: closeAddModal}] = useDisclosure();
  return (
    <>
      <Modal
        title="Add File"
        opened={addModalIsOpen}
        onClose={closeAddModal}
      >
        <CreateDocumentFileModal
          onClose={openAddModal}
          document={data}
          mutate={mutate}
        />
      </Modal>
      {data.can_edit && (
        <Stack>
          <TextInput
            label="Display Name"
            value={displayName ?? data.display_name}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Category"
                data={categoryOptions ? (options(categoryOptions) as any) : []}
                value={
                  categoryOptions &&
                  (category ? categoryOptions[category].value : data.category)
                }
                onChange={(value: string | null) => {
                  value && setCategory(value);
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Creatable
                title="Document type"
                getCreateLabel={(query: string) =>
                  `+ Create new document type "${query}"`
                }
                onCreate={(query: string) => {
                  setDocumentType(query);
                  setDocumentTypeOptions([...(documentTypes ?? []), query]);
                  return query;
                }}
                data={documentTypeOptions}
                value={
                  documentTypeOptions && (documentType ?? data.document_type)
                }
                onChange={(value: string) => {
                  setDocumentType(value);
                }}
              />
            </Grid.Col>
          </Grid>
          <div>
            <Text size="sm">Description</Text>
            <Editor
              value={descriptionDraftText ?? data.description}
              onChange={setDescriptionDraftText}
              imageHandler={imageHandler}
              preview={value => <MarkdownText value={value} />}
              undoStack={descriptionUndoStack}
              setUndoStack={setDescriptionUndoStack}
            />
          </div>
          <Flex justify="end">
            <Button
              loading={loading}
              leftSection={<IconDeviceFloppy />}
              onClick={() =>
                updateDocument({
                  display_name: displayName,
                  category,
                  document_type: documentType,
                  description: descriptionDraftText,
                })
              }
              disabled={displayName?.trim() === ""}
            >
              Save
            </Button>
          </Flex>
        </Stack>
      )}
      <Title order={3}>Files</Title>
      {data.api_key && (
        <Flex align="center" my="sm" gap="sm">
          API Key:
          <pre>{data.api_key}</pre>
          <IconButton
            loading={regenerateLoading}
            onClick={regenerate}
            size="sm"
            icon={<IconReload />}
            tooltip="Regenerating the API token will invalidate the old one and generate a new one"
          />
        </Flex>
      )}
      <List mb="md">
        {data.files.map(file => (
          <DocumentFileItem
            key={file.oid}
            document={data}
            file={file}
            mutate={mutate}
          />
        ))}
      </List>
      <Flex justify="end">
        <Button leftSection={<IconPlus />} onClick={toggleAddModalIsOpen}>
          Add
        </Button>
      </Flex>
      {data.can_delete && (
        <>
          <Title order={3}>Red Zone</Title>
          <Flex wrap="wrap" justify="space-between" align="center" my="md">
            <Flex direction="column">
              <Title order={4}>Delete this document</Title>
              <div>
                Deleting the document will delete all associated files and all
                comments. <b>This cannot be undone.</b>
              </div>
            </Flex>

            <Button
              leftSection={<IconTrash />}
              color="red"
              onClick={toggleDeleteModalIsOpen}
            >
              Delete
            </Button>
          </Flex>
        </>
      )}
      <Modal
        opened={deleteModalIsOpen}
        title="Are you absolutely sure?"
        onClose={closeDeleteModal}
      >
        <Modal.Body>
          Deleting the document will delete all associated files and all
          comments. <b>This cannot be undone.</b>
          <Group justify="right" mt="md">
            <Button onClick={toggleDeleteModalIsOpen}>Not really</Button>
            <Button onClick={deleteDocument} color="red">
              Delete this document
            </Button>
          </Group>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DocumentSettings;
