import {
  Button,
  InputField,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PlusIcon,
  Spinner,
} from "@vseth/components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useCreateSummary } from "../api/hooks";
import { useUser } from "../auth";

interface Props {
  categorySlug: string;
  toggle: () => void;
}

const CreateSummaryForm: React.FC<Props> = ({ categorySlug, toggle }) => {
  const { username } = useUser()!;
  const [displayName, setDisplayName] = useState("");
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

        <div className="form-text text-muted">
          An empty new summary will be created. One or more files can be added
          to the summary in the settings tab.
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          disabled={loading || displayName === ""}
          onClick={() => run(displayName, categorySlug)}
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
