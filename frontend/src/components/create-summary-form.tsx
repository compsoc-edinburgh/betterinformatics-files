import {
  Button,
  FormGroup,
  InputField,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PlusIcon,
  Spinner,
} from "@vseth/components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { NamedBlob } from "../api/fetch-utils";
import { useCreateSummary } from "../api/hooks";
import { useUser } from "../auth";
import FileInput from "./file-input";

interface Props {
  categorySlug: string;
  toggle: () => void;
}

const CreateSummaryForm: React.FC<Props> = ({ categorySlug, toggle }) => {
  const { username } = useUser()!;
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);
  const history = useHistory();
  const [loading, run] = useCreateSummary(({ slug }) => {
    history.push(`/user/${username}/summary/${slug}/`);
  });
  return (
    <>
      <ModalHeader toggle={toggle}>Add Summary</ModalHeader>
      <ModalBody>
        <InputField
          label="Display Name"
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />
        <FormGroup>
          <label className="form-input-label">File</label>
          <FileInput value={file} onChange={setFile} />
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
            run(
              displayName,
              categorySlug,
              file ??
                new NamedBlob(
                  new Blob([], { type: "application/octet-stream" }),
                  "summary.md",
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

export default CreateSummaryForm;
