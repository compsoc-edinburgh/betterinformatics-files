import {
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  ListGroup,
  ListGroupItem,
} from "@vseth/components";
import React, { useState } from "react";

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
    <>
      <ListGroup>
        {offeredIn.map(([meta1, meta2]) => (
          <ListGroupItem key={`${meta1}-${meta2}`}>
            <Button close onClick={() => onRemove(meta1, meta2)} />
            {meta1} {meta2}
          </ListGroupItem>
        ))}
      </ListGroup>
      <InputGroup>
        <Input
          type="text"
          placeholder="Meta1"
          value={newMeta1}
          onChange={e => setNewMeta1(e.currentTarget.value)}
        />
        <Input
          type="text"
          placeholder="Meta2"
          value={newMeta2}
          onChange={e => setNewMeta2(e.currentTarget.value)}
        />
        <InputGroupAddon addonType="append">
          <Button block onClick={onAdd}>
            Add
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </>
  );
};
export default OfferedInEditor;
