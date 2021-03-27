import {
  ModalHeader,
  ModalBody,
  InputField,
  ModalFooter,
  Button,
  Row,
} from "@vseth/components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { NamedBlob } from "../api/fetch-utils";
import { useCreateSummary } from "../api/hooks";
import FileInput from "./file-input";

interface Props {
  categorySlug: string;
  toggle: () => void;
}

const CreateSummaryForm: React.FC<Props> = ({ categorySlug, toggle }) => {
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);
  const history = useHistory();
  const [loading, run] = useCreateSummary(({ slug }) => {
    history.push(`/summary/${slug}/`);
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

        <FileInput value={file} onChange={setFile} />
      </ModalBody>
      <ModalFooter>
        <Button
          disabled={displayName === ""}
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
          Add Summary
        </Button>
      </ModalFooter>
    </>
  );
};

export default CreateSummaryForm;
