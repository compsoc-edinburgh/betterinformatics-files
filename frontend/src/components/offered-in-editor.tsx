import {
  Alert,
  Button,
  Col,
  Creatable,
  Form,
  FormGroup,
  Label,
  ListGroup,
  ListGroupItem,
  Row,
} from "@vseth/components";
import React, { useMemo, useState } from "react";
import { useMetaCategories } from "../api/hooks";

interface OfferedInEditorProps {
  offeredIn: Array<readonly [string, string]>;
  setOfferedIn: (newOfferedIn: Array<readonly [string, string]>) => void;
}
const OfferedInEditor: React.FC<OfferedInEditorProps> = ({
  offeredIn,
  setOfferedIn,
}) => {
  const [newMeta1, setNewMeta1] = useState("");
  const meta1Value = useMemo(() => ({ value: newMeta1, label: newMeta1 }), [
    newMeta1,
  ]);
  const [newMeta2, setNewMeta2] = useState("");
  const meta2Value = useMemo(() => ({ value: newMeta2, label: newMeta2 }), [
    newMeta2,
  ]);
  const [error, loading, data] = useMetaCategories();
  const meta1Options = useMemo(
    () =>
      data && data.map(d => ({ value: d.displayname, label: d.displayname })),
    [data],
  );
  const meta2Options = useMemo(
    () =>
      data && newMeta1.length > 0
        ? data
            .find(m => m.displayname === newMeta1)
            ?.meta2.map(m => ({ value: m.displayname, label: m.displayname }))
        : undefined,
    [data, newMeta1],
  );
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
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <ListGroup>
        {offeredIn.map(([meta1, meta2]) => (
          <ListGroupItem key={`${meta1}-${meta2}`}>
            <Button close onClick={() => onRemove(meta1, meta2)} />
            {meta1} {meta2}
          </ListGroupItem>
        ))}
      </ListGroup>
      <Form
        onSubmit={e => {
          e.preventDefault();
          onAdd();
        }}
      >
        <Row form className="mt-2">
          <Col>
            {data && (
              <FormGroup>
                <Label for="Meta 1" className="form-input-label">
                  Meta 1
                </Label>
                <Creatable
                  inputId="Meta 1"
                  options={meta1Options}
                  isLoading={loading}
                  value={meta1Value}
                  onChange={({ value }: any) => {
                    setNewMeta1(value);
                    setNewMeta2("");
                  }}
                />
              </FormGroup>
            )}
          </Col>
          <Col>
            {data && (
              <FormGroup>
                <Label for="Meta 2" className="form-input-label">
                  Meta 2
                </Label>
                <Creatable
                  inputId="Meta 2"
                  options={meta2Options}
                  isLoading={loading}
                  isDisabled={meta1Value === undefined}
                  value={meta2Value}
                  placeholder="Meta 2"
                  onChange={({ value }: any) => setNewMeta2(value)}
                />
              </FormGroup>
            )}
          </Col>
          <Col md={2}>
            <FormGroup>
              <Label for="Meta 2" className="form-input-label">
                &nbsp;
              </Label>
              <Button block type="submit">
                Add
              </Button>
            </FormGroup>
          </Col>
        </Row>
      </Form>
    </>
  );
};
export default OfferedInEditor;
