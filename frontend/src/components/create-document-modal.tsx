import {
  Button,
  TextInput,
  Modal,
  Group,
} from "@mantine/core";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Icon, ICONS } from "vseth-canine-ui";
import { useCreateDocument } from "../api/hooks";
import { useUser } from "../auth";

interface Props {
  categorySlug: string;
  isOpen: boolean;
  toggle: () => void;
}

const CreateDocumentForm: React.FC<Props> = ({ categorySlug, isOpen, toggle }) => {
  const { username } = useUser()!;
  const [displayName, setDisplayName] = useState("");
  const history = useHistory();
  const [loading, run] = useCreateDocument(({ slug }) => {
    history.push(`/user/${username}/document/${slug}/`);
  });
  return (
    <Modal opened={isOpen} title="Add Document" onClose={toggle}>
      <Modal.Body>
        <Group>
          <TextInput
            label="Display Name"
            value={displayName}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />

          <div>
            An empty new document will be created. One or more files can be added
            to the document in the settings tab.
          </div>
          <Button
            color="primary"
            disabled={loading || displayName === ""}
            onClick={() => run(displayName, categorySlug)}
            leftIcon={<Icon icon={ICONS.PLUS} className="ml-2" />}
            loading={loading}
          >
            Add
          </Button>
        </Group>
      </Modal.Body>
    </Modal>
  );
};

export default CreateDocumentForm;
