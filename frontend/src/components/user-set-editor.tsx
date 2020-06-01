import {
  Button,
  Col,
  Form,
  FormGroup,
  InputField,
  Label,
  ListGroup,
  ListGroupItem,
  Row,
} from "@vseth/components";
import React, { useState } from "react";

interface UserSetEditorProps {
  users: string[];
  setUsers: (newUsers: string[]) => void;
}
const UserSetEditor: React.FC<UserSetEditorProps> = ({ users, setUsers }) => {
  const [username, setUsername] = useState("");
  const onAdd = () => {
    if (users.includes(username)) return;
    setUsername("");
    setUsers([...users, username]);
  };
  const remove = (username: string) => {
    setUsers(users.filter(un => un !== username));
  };
  return (
    <>
      <ListGroup>
        {users.map(user => (
          <ListGroupItem key={user}>
            <Button close onClick={() => remove(user)} />
            {user}
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
            <InputField
              type="text"
              label="Name"
              value={username}
              onChange={e => setUsername(e.currentTarget.value)}
            />
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
export default UserSetEditor;
