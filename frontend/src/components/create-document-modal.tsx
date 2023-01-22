import { Loader } from "@mantine/core";
import {
  Button,
  InputField,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@vseth/components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Icon, ICONS } from "vseth-canine-ui";
import { useCreateDocument } from "../api/hooks";
import { useUser } from "../auth";

interface Props {
  categorySlug: string;
  toggle: () => void;
}

const CreateDocumentForm: React.FC<Props> = ({ categorySlug, toggle }) => {
  const { username } = useUser()!;
  const [displayName, setDisplayName] = useState("");
  const history = useHistory();
  const [loading, run] = useCreateDocument(({ slug }) => {
    history.push(`/user/${username}/document/${slug}/`);
  });
  return (
    <>
      <ModalHeader toggle={toggle}>Add Document</ModalHeader>
      <ModalBody>
        <InputField
          label="Display Name"
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />

        <div className="form-text text-muted">
          An empty new document will be created. One or more files can be added
          to the document in the settings tab.
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
            <Loader className="ml-2" size="sm" />
          ) : (
            <Icon icon={ICONS.PLUS} className="ml-2" />
          )}
        </Button>
      </ModalFooter>
    </>
  );
};

export default CreateDocumentForm;
