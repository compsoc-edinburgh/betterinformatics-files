import React, { useState } from "react";
import {
  ListGroup,
  ListGroupItem,
  Button,
  Row,
  Col,
  Input,
} from "@vseth/components";

interface OfferedInEditorProps {
  offeredIn: Array<readonly [string, string]>;
  setOfferedIn: (newOfferedIn: Array<readonly [string, string]>) => void;
}
const OfferedInEditor: React.FC<OfferedInEditorProps> = ({
  offeredIn,
  setOfferedIn,
}) => {
  const [newMeta1, setNewMeta1] = useState("");
  const [newMeta2, setNewMeta2] = useState("");
  const onAdd = () => {
    setNewMeta1("");
    setNewMeta2("");
    setOfferedIn([...offeredIn, [newMeta1, newMeta2]]);
  };
  const onRemove = (meta1: string, meta2: string) => {
    setOfferedIn(
      offeredIn.filter(
        ([meta1s, meta2s]) => meta1s !== meta1 || meta2s !== meta2,
      ),
    );
  };
  return (
    <ListGroup>
      {offeredIn.map(([meta1, meta2]) => (
        <ListGroupItem key={`${meta1}-${meta2}`}>
          <Button close onClick={() => onRemove(meta1, meta2)} />
          {meta1} {meta2}
        </ListGroupItem>
      ))}
      <ListGroupItem>
        <Row>
          <Col md={5}>
            <Input
              type="text"
              placeholder="Meta1"
              value={newMeta1}
              onChange={e => setNewMeta1(e.currentTarget.value)}
            />
          </Col>
          <Col md={5}>
            <Input
              type="text"
              placeholder="Meta2"
              value={newMeta2}
              onChange={e => setNewMeta2(e.currentTarget.value)}
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
export default OfferedInEditor;
