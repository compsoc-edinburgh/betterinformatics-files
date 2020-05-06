import {
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  ListGroup,
  ListGroupItem,
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
      <InputGroup>
        <Input
          type="text"
          placeholder="Name"
          value={username}
          onChange={e => setUsername(e.currentTarget.value)}
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
export default UserSetEditor;
