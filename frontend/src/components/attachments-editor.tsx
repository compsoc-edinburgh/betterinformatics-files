import {
  Badge,
  Button,
  CloseButton,
  Flex,
  Paper,
  Stack,
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
    <div className="mb-5">
      <Stack>
        {attachments.map(({ displayname, filename }, index) => (
          <Paper withBorder p="xs" key={toKey(filename)}>
            <CloseButton onClick={() => onRemove(index)} />
            {displayname} <Badge>{toKey(filename)}</Badge>
            {filename instanceof File && <Badge color="success">New</Badge>}
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
          placeholder="Display name"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />
        <Button onClick={onAdd}>
          Add
        </Button>
      </Flex>
    </div>
  );
};
export default AttachmentsEditor;
