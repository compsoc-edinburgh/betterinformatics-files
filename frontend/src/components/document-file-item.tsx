import {
  ListGroupItem,
  ListGroupItemHeading,
  ListGroupItemText,
  Badge,
  Row,
  Col,
  ModalHeader,
  Modal,
  ModalBody,
  FormGroup,
  InputField,
  Button,
  ModalFooter,
  Spinner,
  SaveIcon,
} from "@vseth/components";
import React, { useState } from "react";
import {
  Mutate,
  useDeleteDocumentFile,
  useUpdateDocumentFile,
} from "../api/hooks";
import useToggle from "../hooks/useToggle";
import { Document, DocumentFile } from "../interfaces";
import FileInput from "./file-input";
import IconButton from "./icon-button";

interface Props {
  document: Document;
  file: DocumentFile;
  mutate: Mutate<Document>;
}

const DocumentFileItem: React.FC<Props> = ({ file, document, mutate }) => {
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [replaceFile, setFile] = useState<File | undefined>(undefined);

  const [deleteLoading, deleteFile] = useDeleteDocumentFile(
    document.author,
    document.slug,
    file.oid,
    () => {
      mutate(s => ({
        ...s,
        files: s.files.filter(f => f.oid !== file.oid),
      }));
    },
  );
  const [updateLoading, updateFile] = useUpdateDocumentFile(
    document.author,
    document.slug,
    file.oid,
    file => {
      setDisplayName(undefined);
      setFile(undefined);
      mutate(s => ({
        ...s,
        files: s.files.map(f => (f.oid !== file.oid ? f : file)),
      }));
      toggleEditIsOpen(false);
    },
  );
  const [editIsOpen, toggleEditIsOpen] = useToggle();
  const [keyIsOpen, toggleKeyIsOpen] = useToggle();
  return (
    <>
      <Modal toggle={toggleEditIsOpen} isOpen={editIsOpen}>
        <ModalHeader toggle={toggleEditIsOpen}>
          Edit "{file.display_name}"
        </ModalHeader>
        <ModalBody>
          <InputField
            label="Display Name"
            type="text"
            value={displayName ?? file.display_name}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />
          <FormGroup>
            <label className="form-input-label">Replace File</label>
            <FileInput value={replaceFile} onChange={setFile} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            disabled={displayName === ""}
            onClick={() =>
              updateFile({ display_name: displayName, file: replaceFile })
            }
          >
            Save{" "}
            {updateLoading ? (
              <Spinner className="ml-2" size="sm" />
            ) : (
              <SaveIcon className="ml-2" />
            )}
          </Button>
        </ModalFooter>
      </Modal>
      <Modal toggle={toggleKeyIsOpen} isOpen={keyIsOpen} size="lg">
        <ModalHeader toggle={toggleKeyIsOpen}>Access Token</ModalHeader>
        <ModalBody>
          <p>
            Token: <code>{document.api_key}</code>
          </p>
          <p>
            This token can be used to replace the file without needing to login
            manually. You could for example use it in a GitLab / Github CI
            script to update the file whenever you push changes to a git
            repository.
          </p>
          <p>
            The token is valid for an endpoint that can be found at{" "}
            <code>POST /api/document/document_slug/files/file_id/update</code>. The token has to be supplied
            as an Authorization header, a replacement file can be sent as
            multipart-form upload with the key "file". The content type and
            filename of the new file are ignored, the extension and the filename
            won't change.
          </p>
          <p>
            The token shouldn't be made public - you should always store it in a
            secret and hand it over to scripts using an environment variable.
          </p>
          <p>
            With <code>curl</code> this file could be replaced with the
            following command assuming that the new file is located in the
            current working directory and named "my_document.pdf".
          </p>
          <pre>
            <code>
              {`curl ${window.location.origin}/api/document/${document.slug}/files/${file.oid}/update \\\n  -H "Authorization: ${document.api_key}" \\\n  -F "file=@my_document.pdf"`}
            </code>
          </pre>
        </ModalBody>
      </Modal>
      <ListGroupItem className="d-md-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <ListGroupItemHeading>
            {file.display_name || <i>Unnamed</i>}
          </ListGroupItemHeading>
          <ListGroupItemText>
            <Badge color="primary">{file.filename}</Badge>{" "}
            <Badge>{file.mime_type}</Badge>
          </ListGroupItemText>
        </div>
        <Row form>
          <Col xs="auto">
            <IconButton
              icon="KEY"
              onClick={toggleKeyIsOpen}
              tooltip="View access token"
            />
          </Col>
          <Col xs="auto">
            <IconButton
              icon="EDIT"
              onClick={toggleEditIsOpen}
              tooltip="Edit file"
            />
          </Col>
          <Col xs="auto">
            <IconButton
              icon="DELETE"
              color="danger"
              onClick={deleteFile}
              loading={deleteLoading}
              tooltip="Delete file"
            />
          </Col>
        </Row>
      </ListGroupItem>
    </>
  );
};

export default DocumentFileItem;
