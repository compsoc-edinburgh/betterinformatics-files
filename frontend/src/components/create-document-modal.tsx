import { Button, TextInput, Modal, Stack } from "@mantine/core";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useCreateDocument } from "../api/hooks";
import { useUser } from "../auth";
import { IconPlus } from "@tabler/icons-react";

interface Props {
  categorySlug: string;
  isOpen: boolean;
  onClose: () => void;
}

const CreateDocumentForm: React.FC<Props> = ({
  categorySlug,
  isOpen,
  onClose,
}) => {
  const { username } = useUser()!;
  const [displayName, setDisplayName] = useState("");
  const history = useHistory();
  const [loading, run] = useCreateDocument(({ slug }) => {
    history.push(`/user/${username}/document/${slug}/`);
  });
  return (
    <Modal opened={isOpen} title="Add Document" onClose={onClose}>
      <Modal.Body>
        <Stack>
          <TextInput
            label="Display Name"
            placeholder="My wonderful summary"
            value={displayName}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />

          <div>
            An empty new document will be created. One or more files can be
            added to the document in the settings tab.
          </div>
          <Button
            disabled={loading || displayName.trim() === ""}
            onClick={() => run(displayName.trim(), categorySlug)}
            leftSection={<IconPlus />}
            loading={loading}
          >
            Add
          </Button>
        </Stack>
      </Modal.Body>
    </Modal>
  );
};

export default CreateDocumentForm;
