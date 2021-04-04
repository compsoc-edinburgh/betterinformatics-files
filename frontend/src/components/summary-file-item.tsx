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
  PlusIcon,
  Spinner,
  SaveIcon,
} from "@vseth/components";
import React, { useState } from "react";
import {
  Mutate,
  useDeleteSummaryFile,
  useUpdateSummaryFile,
} from "../api/hooks";
import useToggle from "../hooks/useToggle";
import { Summary, SummaryFile } from "../interfaces";
import FileInput from "./file-input";
import IconButton from "./icon-button";

interface Props {
  summary: Summary;
  file: SummaryFile;
  mutate: Mutate<Summary>;
}

const SummaryFileItem: React.FC<Props> = ({ file, summary, mutate }) => {
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [replaceFile, setFile] = useState<File | undefined>(undefined);

  const [deleteLoading, deleteFile] = useDeleteSummaryFile(
    summary.author,
    summary.slug,
    file.oid,
    () => {
      mutate(s => ({
        ...s,
        files: s.files.filter(f => f.oid !== file.oid),
      }));
    },
  );
  const [updateLoading, updateFile] = useUpdateSummaryFile(
    summary.author,
    summary.slug,
    file.oid,
    file => {
      setDisplayName(undefined);
      setFile(undefined);
      mutate(s => ({
        ...s,
        files: s.files.map(f => (f.oid !== file.oid ? f : file)),
      }));
      toggleIsOpen(false);
    },
  );
  const [isOpen, toggleIsOpen] = useToggle();
  return (
    <>
      <Modal toggle={toggleIsOpen} isOpen={isOpen}>
        <ModalHeader toggle={toggleIsOpen}>
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
            <IconButton icon="EDIT" onClick={toggleIsOpen} />
          </Col>
          <Col xs="auto">
            <IconButton
              icon="DELETE"
              color="danger"
              onClick={deleteFile}
              loading={deleteLoading}
            />
          </Col>
        </Row>
      </ListGroupItem>
    </>
  );
};

export default SummaryFileItem;
