import {
  Badge,
  Button,
  CloseButton,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import React, { useState } from "react";
import FileInput from "./file-input";

export interface EditorAttachment {
  displayname: string;
  filename: File | string;
}
interface AttachmentsEditorProps {
  attachments: EditorAttachment[];
  setAttachments: (newAttachments: EditorAttachment[]) => void;
}
const toKey = (file: File | string) =>
  file instanceof File ? file.name : file;
const AttachmentsEditor: React.FC<AttachmentsEditorProps> = ({
  attachments,
  setAttachments,
}) => {
  const [file, setFile] = useState<File | undefined>();
  const [displayName, setDisplayName] = useState("");
  const onAdd = () => {
    if (file === undefined) return;
    setAttachments([
      ...attachments,
      { displayname: displayName, filename: file },
    ]);
    setFile(undefined);
    setDisplayName("");
  };
  const onRemove = (index: number) => {
    setAttachments(attachments.filter((_item, i) => i !== index));
  };
  return (
    <div>
      <Stack gap="xs" mb="xs">
        {attachments.map(({ displayname, filename }, index) => (
          <Paper withBorder p="xs" key={toKey(filename)}>
            <Group>
              <CloseButton onClick={() => onRemove(index)} />
              <Text>{displayname}</Text>
              <Badge>{toKey(filename)}</Badge>
              {filename instanceof File && <Badge color="green">New</Badge>}
            </Group>
          </Paper>
        ))}
      </Stack>
      <Flex>
        <FileInput
          accept=".pdf,.zip,.tar.gz,.tar.xz"
          value={file}
          onChange={setFile}
        />

        <TextInput
          mx="sm"
          placeholder="Display name"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />
        <Button onClick={onAdd}>Add</Button>
      </Flex>
    </div>
  );
};
export default AttachmentsEditor;
