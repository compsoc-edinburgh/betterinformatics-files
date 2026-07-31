import { Button, TextInput, Modal, Stack, Text } from "@mantine/core";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconPlus } from "@tabler/icons-react";
import { useCreateDocument } from "../api/hooks/documents";

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
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();
  const { mutate, isError, isPending } = useCreateDocument({
    mutation: {
      onSuccess({ value: document }) {
        void navigate(`/document/${document.slug}`);
      },
    },
  });

  function handleCreateDocument() {
    mutate({
      data: {
        display_name: displayName,
        category: categorySlug,
        anonymised: false,
      },
    });
  }

  return (
    <Modal opened={isOpen} title="Add Document Bundle" onClose={onClose}>
      <Modal.Body>
        <Stack>
          {isError && <Text c="red">This is an invalid display name.</Text>}
          <TextInput
            label="Display Name"
            placeholder="My wonderful summary"
            value={displayName}
            onChange={e => setDisplayName(e.currentTarget.value)}
          />

          <div>
            An empty new document bundle will be created. One or more files can
            be added to the document bundle in the settings tab.
          </div>
          <Button
            disabled={isPending || displayName.trim() === ""}
            onClick={handleCreateDocument}
            leftSection={<IconPlus />}
            loading={isPending}
          >
            Add
          </Button>
        </Stack>
      </Modal.Body>
    </Modal>
  );
};

export default CreateDocumentForm;
