import { Button, Flex, Stack, TextInput } from "@mantine/core";
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

  const withIndexedFilename = (
    candidateDisplayName: string,
    candidateFile: File | string,
    items: EditorAttachment[],
  ) => {
    const createIndexedFilename = (index: number) =>
      `${index}_${toKey(candidateFile)}`;
    let nextFilenameKey = toKey(candidateFile);
    let index = 0;

    while (
      items.some(
        item =>
          candidateDisplayName === item.displayname &&
          nextFilenameKey === toKey(item.filename),
      )
    ) {
      nextFilenameKey = createIndexedFilename(index);
      index += 1;
    }

    if (candidateFile instanceof File) {
      return new File([candidateFile], nextFilenameKey, {
        type: candidateFile.type,
        lastModified: candidateFile.lastModified,
      });
    }

    return nextFilenameKey;
  };

  const onAdd = () => {
    if (file === undefined) {
      return;
    }

    const nextFilename = withIndexedFilename(displayName, file, attachments);

    setAttachments([
      ...attachments,
      { displayname: displayName, filename: nextFilename },
    ]);
    setFile(undefined);
    setDisplayName("");
  };
  const onRemove = (displayname: string, filename: File | string) => {
    setAttachments(
      attachments.filter(
        item =>
          displayname !== item.displayname ||
          toKey(filename) !== toKey(item.filename),
      ),
    );
  };

  return (
    <div>
      <Stack gap="xs" mb="xs">
        {attachments.map(({ displayname, filename }, i) => (
          <AttachmentFileItem
            key={i}
            displayname={displayname}
            filename={filename}
            remove={() => {
              onRemove(displayname, filename);
            }}
            edit={(newDisplayname, newFilename) => {
              const remainingAttachments = attachments.filter(
                item =>
                  displayname !== item.displayname ||
                  toKey(filename) !== toKey(item.filename),
              );

              const nextFilename = withIndexedFilename(
                newDisplayname,
                newFilename,
                remainingAttachments,
              );

              setAttachments([
                ...remainingAttachments,
                { displayname: newDisplayname, filename: nextFilename },
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
        <Button onClick={onAdd}>
          Add
        </Button>
      </Flex>
    </div>
  );
};
export default AttachmentsEditor;
