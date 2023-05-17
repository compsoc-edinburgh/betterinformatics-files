import { useRequest } from "@umijs/hooks";
import {
  Button,
  DeleteIcon,
  FormGroup,
  InputField,
  ListGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PlusIcon,
  RepeatIcon,
  SaveIcon,
  Select,
  Spinner,
} from "@vseth/components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
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
  slug: string;
}

const DocumentSettings: React.FC<Props> = ({ slug, data, mutate }) => {
  const history = useHistory();
  const { loading: categoriesLoading, data: categories } =
    useRequest(loadCategories);
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
    slug,
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
    slug,
    result => mutate(s => ({ ...s, ...result })),
  );
  const [_, deleteDocument] = useDeleteDocument(
    data.author,
    slug,
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
      <Modal isOpen={addModalIsOpen} toggle={toggleAddModalIsOpen}>
        <CreateDocumentFileModal
          toggle={toggleAddModalIsOpen}
          document={data}
          mutate={mutate}
        />
      </Modal>
      {data.can_edit && (
        <>
          <InputField
            label="Display Name"
            value={displayName ?? data.display_name}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />
          <FormGroup>
            <label className="form-input-label">Category</label>
            <Select
              options={categoryOptions ? (options(categoryOptions) as any) : []}
              value={
                categoryOptions &&
                (category
                  ? categoryOptions[category]
                  : categoryOptions[data.category])
              }
              onChange={(e: any) => {
                setCategory(e.value as string);
              }}
              isLoading={categoriesLoading}
              required
            />
          </FormGroup>
          <FormGroup>
            <label className="form-input-label">Description</label>
            <Editor
              value={descriptionDraftText ?? data.description}
              onChange={setDescriptionDraftText}
              imageHandler={imageHandler}
              preview={value => <MarkdownText value={value} />}
              undoStack={descriptionUndoStack}
              setUndoStack={setDescriptionUndoStack}
            />
          </FormGroup>
          <div className="form-group d-flex justify-content-end">
            <Button
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
              {loading ? (
                <Spinner className="ml-2" size="sm" />
              ) : (
                <SaveIcon className="ml-2" />
              )}
            </Button>
          </div>
        </>
      )}
      <h3 className="mt-5 mb-4">Files</h3>
      {data.api_key && (
        <div className="flex align-items-center my-2">
          API Key:
          <pre className="mx-2 my-auto">{data.api_key}</pre>
          <IconButton
            loading={regenerateLoading}
            onClick={regenerate}
            size="sm"
            icon={RepeatIcon}
            tooltip="Regenerating the API token will invalidate the old one and generate a new one"
          />
        </div>
      )}
      <ListGroup className="mb-2">
        {data.files.map(file => (
          <DocumentFileItem
            key={file.oid}
            document={data}
            file={file}
            mutate={mutate}
          />
        ))}
      </ListGroup>
      <div className="form-group d-flex justify-content-end">
        <Button onClick={toggleAddModalIsOpen}>
          Add
          <PlusIcon className="ml-2" />
        </Button>
      </div>
      {data.can_delete && (
        <>
          <h3 className="mt-5 mb-4">Danger Zone</h3>
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div className="d-flex flex-column">
              <h6>Delete this document</h6>
              <div>
                Deleting the document will delete all associated files and all
                comments. <b>This cannot be undone.</b>
              </div>
            </div>

            <Button color="danger" onClick={toggleDeleteModalIsOpen}>
              Delete <DeleteIcon className="ml-2" />
            </Button>
          </div>
        </>
      )}
      <Modal isOpen={deleteModalIsOpen} toggle={toggleDeleteModalIsOpen}>
        <ModalHeader toggle={toggleDeleteModalIsOpen}>
          Are you absolutely sure?
        </ModalHeader>
        <ModalBody>
          Deleting the document will delete all associated files and all
          comments. <b>This cannot be undone.</b>
        </ModalBody>
        <ModalFooter>
          <Button onClick={toggleDeleteModalIsOpen}>Not really</Button>
          <Button
            onClick={deleteDocument}
            color="danger"
            loading={deleteDocument}
          >
            Delete this document
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DocumentSettings;
