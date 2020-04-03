import React, { useState } from "react";
import {
  ListGroup,
  ListGroupItem,
  Button,
  Row,
  Col,
  Input,
} from "@vseth/components";

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
    <ListGroup>
      {users.map(user => (
        <ListGroupItem key={user}>
          <Button close onClick={() => remove(user)} />
          {user}
        </ListGroupItem>
      ))}
      <ListGroupItem>
        <Row>
          <Col md={10}>
            <Input
              type="text"
              placeholder="Name"
              value={username}
              onChange={e => setUsername(e.currentTarget.value)}
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
export default UserSetEditor;
