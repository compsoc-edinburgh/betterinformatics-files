import React, { useState } from "react";
import {
  ListGroup,
  ListGroupItem,
  Button,
  Badge,
  Row,
  Col,
  Input,
} from "@vseth/components";
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
    <ListGroup>
      {attachments.map(({ displayname, filename }, index) => (
        <ListGroupItem key={toKey(filename)}>
          <Button close onClick={() => onRemove(index)} />
          {displayname} <Badge>{toKey(filename)}</Badge>
          {filename instanceof File && <Badge color="success">New</Badge>}
        </ListGroupItem>
      ))}
      <ListGroupItem>
        <Row>
          <Col md={5}>
            <FileInput value={file} onChange={setFile} />
          </Col>
          <Col md={5}>
            <Input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.currentTarget.value)}
            />
          </Col>
          <Col md={2}>
            <Button block onClick={onAdd}>
              Add
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    </ListGroup>
  );
};
export default AttachmentsEditor;
