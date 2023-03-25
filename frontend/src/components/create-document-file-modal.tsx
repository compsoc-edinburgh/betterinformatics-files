import {
  ModalHeader,
  ModalBody,
  InputField,
  FormGroup,
  ModalFooter,
  Button,
  Spinner,
  PlusIcon,
} from "@vseth/components";
import * as React from "react";
import { useState } from "react";
import { NamedBlob } from "../api/fetch-utils";
import { Mutate, useCreateDocumentFile } from "../api/hooks";
import { Toggle } from "../hooks/useToggle";
import { Document } from "../interfaces";
import FileInput from "./file-input";

interface Props {
  document: Document;
  toggle: Toggle;
  mutate: Mutate<Document>;
}

const CreateDocumentFileModal: React.FC<Props> = ({
  toggle,
  document,
  mutate,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);

  const [loading, createDocumentFile] = useCreateDocumentFile(
    document.author,
    document.slug,
    f => {
      toggle(false);
      mutate(s => ({ ...s, files: [...s.files, f] }));
      setDisplayName("");
      setFile(undefined);
    },
  );

  return (
    <>
      <ModalHeader toggle={loading ? undefined : toggle}>Add File</ModalHeader>
      <ModalBody>
        <InputField
          label="Display Name"
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />
        <FormGroup>
          <label className="form-input-label">File</label>
          <FileInput
            value={file}
            onChange={setFile}
            accept=".pdf,.tex,.md,.txt,.zip,.apkg" // apkg=anki
          />
          <div className="form-text text-muted">
            If you don't select any file we will create an empty markdown file
            for you that you can edit afterwards.
          </div>
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          disabled={loading || displayName === ""}
          onClick={() =>
            createDocumentFile(
              displayName,
              file ??
                new NamedBlob(
                  new Blob([], { type: "application/octet-stream" }),
                  "document.md",
                ),
            )
          }
        >
          Add{" "}
          {loading ? (
            <Spinner className="ml-2" size="sm" />
          ) : (
            <PlusIcon className="ml-2" />
          )}
        </Button>
      </ModalFooter>
    </>
  );
};

export default CreateDocumentFileModal;
