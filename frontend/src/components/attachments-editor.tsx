import {
  Badge,
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  ListGroup,
  ListGroupItem,
} from "@vseth/components";
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
      <ListGroup>
        {attachments.map(({ displayname, filename }, index) => (
          <ListGroupItem key={toKey(filename)}>
            <Button close onClick={() => onRemove(index)} />
            {displayname} <Badge>{toKey(filename)}</Badge>
            {filename instanceof File && <Badge color="success">New</Badge>}
          </ListGroupItem>
        ))}
      </ListGroup>
      <InputGroup>
        <FileInput accept="application/pdf" value={file} onChange={setFile} />

        <Input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={e => setDisplayName(e.currentTarget.value)}
        />
        <InputGroupAddon addonType="append">
          <Button block onClick={onAdd}>
            Add
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};
export default AttachmentsEditor;
