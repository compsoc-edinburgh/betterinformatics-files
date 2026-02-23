import {
  Badge,
  Button,
  CloseButton,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { toKey } from "./attachments-editor";
import { useDisclosure } from "@mantine/hooks";
import IconButton from "./icon-button";
import useInitialState from "../hooks/useInitialState";
import { useState } from "react";
import FileInput from "./file-input";

interface AttachmentFileItemProps {
  displayname: string;
  filename: File | string;
  remove: () => void;
  edit: (displayname: string, filename: File | string) => void;
}

const AttachmentFileItem: React.FC<AttachmentFileItemProps> = ({
  displayname,
  filename,
  remove,
  edit,
}) => {
  const [
    editModalIsOpen,
    { toggle: toggleEditModalIsOpen, close: closeEditModal },
  ] = useDisclosure();
  const [draftDisplayname, setDraftDisplayname] = useInitialState(displayname);
  const [file, setFile] = useState<File | undefined>();

  return (
    <div key={toKey(filename)}>
      <Modal
        title="Edit Attachment"
        opened={editModalIsOpen}
        onClose={closeEditModal}
        size="lg"
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Current file: {toKey(filename)}
          </Text>
          <TextInput
            label="Display name"
            placeholder="Display name"
            value={draftDisplayname}
            onChange={e => setDraftDisplayname(e.currentTarget.value)}
            autoFocus
          />
          <div>
            <Text size="sm" mb={4}>
              Replace file (optional)
            </Text>
            <FileInput
              placeholder={toKey(filename)}
              accept=".pdf,.zip,.tar.gz,.tar.xz"
              value={file}
              onChange={setFile}
            />
          </div>
          <Group justify="right" mt="xs">
            <Button variant="default" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button
              disabled={draftDisplayname.trim() === ""}
              onClick={() => {
                if (file !== undefined) {
                  edit(draftDisplayname, file);
                } else {
                  edit(draftDisplayname, filename);
                }
                toggleEditModalIsOpen();
              }}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Paper withBorder p="xs" key={toKey(filename)}>
        <Group>
          <CloseButton onClick={remove} />
          <IconButton
            variant="filled"
            tooltip="Edit attachment name"
            icon={<IconEdit />}
            onClick={toggleEditModalIsOpen}
          />
          <Text>{displayname}</Text>
          <Badge>{toKey(filename)}</Badge>
          {filename instanceof File && <Badge color="green">New</Badge>}
        </Group>
      </Paper>
    </div>
  );
};
export default AttachmentFileItem;
