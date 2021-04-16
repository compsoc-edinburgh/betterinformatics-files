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
  SaveIcon,
  Select,
  Spinner,
} from "@vseth/components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  loadCategories,
  Mutate,
  useDeleteDocument,
  useUpdateDocument,
} from "../api/hooks";
import useToggle from "../hooks/useToggle";
import { Document } from "../interfaces";
import { createOptions, options } from "../utils/ts-utils";
import CreateDocumentFileModal from "./create-document-file-modal";
import DocumentFileItem from "./document-file-item";

interface Props {
  data: Document;
  mutate: Mutate<Document>;
  slug: string;
}

const DocumentSettings: React.FC<Props> = ({ slug, data, mutate }) => {
  const history = useHistory();
  const { loading: categoriesLoading, data: categories } = useRequest(
    loadCategories,
  );
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
  const [deleteLoading, deleteDocument] = useDeleteDocument(
    data.author,
    slug,
    () => data && history.push(`/category/${data.category}`),
  );
  const [deleteModalIsOpen, toggleDeleteModalIsOpen] = useToggle();

  const [displayName, setDisplayName] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
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
          <div className="form-group d-flex justify-content-end">
            <Button
              onClick={() =>
                updateDocument({ display_name: displayName, category })
              }
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
