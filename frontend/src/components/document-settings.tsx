import {
  Button,
  List,
  TextInput,
  Modal,
  NativeSelect,
  Flex,
  Title,
  Text,
  Stack,
  Group,
} from "@mantine/core";
import { useRequest } from "@umijs/hooks";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Icon, ICONS } from "vseth-canine-ui";
import { imageHandler } from "../api/fetch-utils";
import {
  loadCategories,
  Mutate,
  useDeleteDocument,
  useRegenerateDocumentAPIKey,
  useUpdateDocument,
} from "../api/hooks";
import useToggle from "../hooks/useToggle";
import { Document } from "../interfaces";
import { createOptions, options } from "../utils/ts-utils";
import CreateDocumentFileModal from "./create-document-file-modal";
import DocumentFileItem from "./document-file-item";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";
import IconButton from "./icon-button";
import MarkdownText from "./markdown-text";

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

  const [loading, updateDocument] = useUpdateDocument(
    data.author,
    data.slug,
    result => {
      mutate(s => ({ ...s, ...result }));
      setDisplayName(undefined);
      setCategory(undefined);
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
  const [deleteModalIsOpen, toggleDeleteModalIsOpen] = useToggle();

  const [displayName, setDisplayName] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [descriptionDraftText, setDescriptionDraftText] = useState<
    string | undefined
  >(undefined);
  const [descriptionUndoStack, setDescriptionUndoStack] = useState<UndoStack>({
    prev: [],
    next: [],
  });

  const [addModalIsOpen, toggleAddModalIsOpen] = useToggle(false);
  return (
    <>
      <Modal
        title="Add File"
        opened={addModalIsOpen}
        onClose={toggleAddModalIsOpen}
      >
        <CreateDocumentFileModal
          toggle={toggleAddModalIsOpen}
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
          <NativeSelect
            label="Category"
            data={categoryOptions ? (options(categoryOptions) as any) : []}
            value={
              categoryOptions &&
              (category
                ? categoryOptions[category].value
                : categoryOptions[data.category].value)
            }
            onChange={(event: any) => {
              setCategory(event.currentTarget.value as string);
            }}
          />
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
              leftIcon={<Icon icon={ICONS.SAVE} />}
              onClick={() =>
                updateDocument({
                  display_name: displayName,
                  category,
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
            iconName={ICONS.REPEAT}
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
        <Button
          leftIcon={<Icon icon={ICONS.PLUS} />}
          onClick={toggleAddModalIsOpen}
        >
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
              leftIcon={<Icon icon={ICONS.DELETE} />}
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
        onClose={toggleDeleteModalIsOpen}
      >
        <Modal.Body>
          Deleting the document will delete all associated files and all
          comments. <b>This cannot be undone.</b>
          <Group position="right" mt="md">
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
