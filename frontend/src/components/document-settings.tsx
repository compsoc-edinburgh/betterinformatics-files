import {
  Button,
  List,
  TextInput,
  Modal,
  Flex,
  Switch,
  Title,
  Text,
  Stack,
  Group,
  Select,
  Grid,
  Loader,
} from "@mantine/core";
import { useRequest } from "ahooks";
import React, { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePendingImages } from "./Editor/pending-images";
import { loadAllCategories } from "../api/hooks";
import { createOptions, options } from "../utils/ts-utils";
import CreateDocumentFileModal from "./create-document-file-modal";
import DocumentFileItem from "./document-file-item";
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
import UserSelect from "./user-select.js";
import {
  useDeleteDocument,
  useListDocumentTypes,
  useRegenerateDocumentApiKey,
  useUpdateDocument,
} from "../api/hooks/documents";
import type { DocumentSchema } from "../api/model/documentSchema";
import type { UserSchema } from "../api/model/userSchema";

const Editor = lazy(() => import("./Editor"));

interface Props {
  document: DocumentSchema;
  refetch: () => void;
}

const DocumentSettings: React.FC<Props> = ({ document, refetch }) => {
  const navigate = useNavigate();
  const { data: categories } = useRequest(loadAllCategories);
  const categoryOptions =
    categories &&
    createOptions(
      Object.fromEntries(
        categories.map(
          category => [category.slug, category.displayname] as const,
        ),
      ) as Record<string, string>,
    );

  const { data: documentTypes, refetch: refetchDocumentTypes } =
    useListDocumentTypes();

  const updateDocument = useUpdateDocument({
    mutation: {
      onSuccess({ value: newDocument }) {
        setDisplayName(undefined);
        setCategory(undefined);
        setDocumentType(undefined);
        setTransferUser(undefined);

        if (newDocument.slug !== document.slug) {
          void navigate(`/document/${newDocument.slug}`, {
            replace: true,
          });
        } else {
          void refetchDocumentTypes();
          refetch();
        }
      },
    },
  });

  const regenerate = useRegenerateDocumentApiKey({
    mutation: {
      onSuccess() {
        refetch();
      },
    },
  });
  const deleteDocument = useDeleteDocument({
    mutation: {
      onSuccess() {
        void navigate(`/category/${document.category}`);
      },
    },
  });

  const [
    deleteModalIsOpen,
    { toggle: toggleDeleteModalIsOpen, close: closeDeleteModal },
  ] = useDisclosure();

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
  const [anonymised, setAnonymised] = useState<boolean | undefined>(undefined);
  const { deferredImageHandler, flushPendingImages, pendingObjectUrls } =
    usePendingImages();
  const [transferUser, setTransferUser] = useState<UserSchema | null>();

  const [
    addModalIsOpen,
    { toggle: toggleAddModalIsOpen, open: openAddModal, close: closeAddModal },
  ] = useDisclosure();

  return (
    <>
      <Modal title="Add File" opened={addModalIsOpen} onClose={closeAddModal}>
        <CreateDocumentFileModal
          onClose={openAddModal}
          document={document}
          refetch={refetch}
        />
      </Modal>
      {document.can_edit && (
        <Stack>
          <TextInput
            label="Display Name"
            value={displayName ?? document.display_name}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Category"
                data={categoryOptions ? options(categoryOptions) : []}
                value={
                  categoryOptions &&
                  (category
                    ? categoryOptions[category].value
                    : document.category)
                }
                onChange={(value: string | null) => {
                  if (value) {
                    setCategory(value);
                  }
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
                  return query;
                }}
                data={documentTypes?.value ?? []}
                value={documentType ?? document.document_type}
                onChange={(value: string) => {
                  setDocumentType(value);
                }}
              />
            </Grid.Col>
          </Grid>
          <div>
            <Text size="sm">Description</Text>
            <Suspense fallback={<Loader />}>
              <Editor
                value={descriptionDraftText ?? document.description}
                onChange={setDescriptionDraftText}
                imageHandler={deferredImageHandler}
                preview={value => (
                  <MarkdownText
                    value={value}
                    pendingImages={pendingObjectUrls}
                  />
                )}
                undoStack={descriptionUndoStack}
                setUndoStack={setDescriptionUndoStack}
              />
            </Suspense>
          </div>
          <div>
            <Text size="sm">Anonymise</Text>
            <Switch
              checked={anonymised ?? document.anonymised}
              onChange={e => setAnonymised(e.currentTarget.checked)}
              label="Check this to hide the author UUN from normal users. Yourself, BI admins, and category admins will still be able to see the original UUN."
            />
          </div>
          <UserSelect
            label="Transfer to User"
            value={transferUser ?? document.pending_transfer_user}
            filter={other => other.id !== document.author.id}
            onChange={setTransferUser}
          />
          <Flex justify="end">
            <Button
              loading={updateDocument.isPending}
              leftSection={<IconDeviceFloppy />}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={async () => {
                const finalDescription =
                  descriptionDraftText !== undefined
                    ? await flushPendingImages(descriptionDraftText)
                    : undefined;

                // undefined is for unchanged (we don't want to edit if nothing changed)
                // null is to unset
                let pendingTransferUser = undefined;
                if (transferUser !== undefined) {
                  pendingTransferUser = transferUser?.username ?? null;
                }

                updateDocument.mutate({
                  slug: document.slug,
                  data: {
                    display_name: displayName,
                    category,
                    document_type: documentType,
                    description: finalDescription,
                    anonymised,
                    pending_transfer_user: pendingTransferUser,
                  },
                });
              }}
              disabled={displayName?.trim() === ""}
            >
              Save
            </Button>
          </Flex>
        </Stack>
      )}
      <Title order={3}>Files</Title>
      {document.api_key && (
        <Flex align="center" my="sm" gap="sm">
          API Key:
          <pre>{document.api_key}</pre>
          <IconButton
            loading={regenerate.isPending}
            onClick={() =>
              regenerate.mutate({
                slug: document.slug,
              })
            }
            size="sm"
            icon={<IconReload />}
            tooltip="Regenerating the API token will invalidate the old one and generate a new one"
          />
        </Flex>
      )}
      <List mb="md">
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
        {document
          .files!.sort((a, b) => a.order - b.order)
          .map(file => (
            <DocumentFileItem
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              max_order={document.files!.length - 1}
              key={file.oid}
              document={document}
              file={file}
              refetch={refetch}
            />
          ))}
      </List>
      <Flex justify="end">
        <Button leftSection={<IconPlus />} onClick={toggleAddModalIsOpen}>
          Add
        </Button>
      </Flex>
      {document.can_delete && (
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
            <Button
              onClick={() => {
                deleteDocument.mutate({
                  slug: document.slug,
                });
              }}
              color="red"
            >
              Delete this document
            </Button>
          </Group>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DocumentSettings;
