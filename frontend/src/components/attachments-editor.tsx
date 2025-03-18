import {
  Button,
  Flex,
  Stack,
  TextInput,
} from "@mantine/core";
import React, { useState } from "react";
import FileInput from "./file-input";
import AttachmentFileItem from "./attachment-file-item";

export interface EditorAttachment {
  displayname: string;
  filename: File | string;
}
interface AttachmentsEditorProps {
  attachments: EditorAttachment[];
  setAttachments: (newAttachments: EditorAttachment[]) => void;
}
export const toKey = (file: File | string) =>
  file instanceof File ? file.name : file;
const AttachmentsEditor: React.FC<AttachmentsEditorProps> = ({
  attachments,
  setAttachments,
}) => {
  const [file, setFile] = useState<File | undefined>();
  const [displayName, setDisplayName] = useState("");
  const onAdd = () => {
    if (file === undefined 
      || attachments.filter((item) => 
        displayName === item.displayname && toKey(file) === toKey(item.filename)).length !== 0) 
      return;
    setAttachments([
      ...attachments,
      { displayname: displayName, filename: file },
    ]);
    setFile(undefined);
    setDisplayName("");
  };
  const onRemove = (displayname: string, filename: File | string) => {
    setAttachments(attachments.filter((item) => 
      displayname !== item.displayname || toKey(filename) !== toKey(item.filename)));
  };

  return (
    <div>
      <Stack gap="xs" mb="xs">
        {attachments.map(({ displayname, filename }) => (
          <AttachmentFileItem
            displayname={displayname}
            filename={filename}
            remove={() => {onRemove(displayname, filename)}}
            allow={(newDisplayname, newFilename) => {
              let editedFilename = filename;
              if (newFilename !== null) editedFilename = newFilename;
              return attachments.filter((item) => 
                newDisplayname === item.displayname && toKey(editedFilename) === toKey(item.filename)).length === 0
            }}
            edit={(newDisplayname, newFilename) => {
              setAttachments([
                ...attachments.filter((item) => 
                  displayname !== item.displayname || toKey(filename) !== toKey(item.filename)),
                {displayname: newDisplayname, filename: newFilename},
              ]);
            }}
          />
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
