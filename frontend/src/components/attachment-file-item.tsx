import {
    Badge,
    Button,
    CloseButton,
    Group,
    Modal,
    Paper,
    Text,
    TextInput,
    FileInput,
} from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { toKey } from "./attachments-editor";
import { useDisclosure } from "@mantine/hooks";
import IconButton from "./icon-button";
import useInitialState from "../hooks/useInitialState";
import { useState } from "react";

interface AttachmentFileItemProps {
    displayname: string;
    filename: File | string;
    remove: () => void;
    allow: (displaynam: string, filename: File | null) => boolean;
    edit: (displayname: string, filename: File | string) => void;
}

const AttachmentFileItem: React.FC<AttachmentFileItemProps> = ({displayname, filename, remove, allow, edit}) => {
 
    const [editModalIsOpen, {toggle: toggleEditModalIsOpen, close: closeEditModal}] = useDisclosure();
    const [draftDisplayname, setDraftDisplayname] = useInitialState(displayname);
    const [file, setFile] = useState<File | null>(null);

    return (
        <div key={toKey(filename)}>
            <Modal
                title="Edit Attachment"
                opened={editModalIsOpen}
                onClose={closeEditModal}
            >
                <Modal.Body>
                    <label>Display name:</label>
                    <TextInput
                        placeholder="Display name"
                        value={draftDisplayname}
                        onChange={e => setDraftDisplayname(e.currentTarget.value)}
                    />
                    <label>File:</label>
                    <FileInput
                        placeholder={`${toKey(filename)}`}
                        accept=".pdf,.zip,.tar.gz,.tar.xz"
                        value={file}
                        onChange={setFile}
                    />
                    <Group justify="right" mt="md">
                        <Button
                            disabled={!allow(draftDisplayname, file)}
                            onClick={() => {
                                if (file !== null) {
                                    edit(draftDisplayname, file);
                                } else {
                                    edit(draftDisplayname, filename);
                                }
                                toggleEditModalIsOpen();
                            }}
                        >
                            Edit
                        </Button>
                    </Group>
                </Modal.Body>
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
    )
};
export default AttachmentFileItem;

