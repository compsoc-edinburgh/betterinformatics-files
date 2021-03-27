import {
  ModalHeader,
  ModalBody,
  InputField,
  ModalFooter,
  Button,
} from "@vseth/components";
import React, { useState } from "react";
import { useCreateSummary } from "../api/hooks";
import FileInput from "./file-input";

interface Props {
  categorySlug: string;
}

const CreateSummaryForm: React.FC<Props> = ({ categorySlug }) => {
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);
  const [loading, run] = useCreateSummary();
  return (
    <>
      <ModalHeader>Add Summary</ModalHeader>
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
          disabled={file === undefined || displayName === ""}
          onClick={() => file && run(displayName, categorySlug, file)}
        >
          Add Summary
        </Button>
      </ModalFooter>
    </>
  );
};

export default CreateSummaryForm;
