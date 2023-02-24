import {
  Form,
  FormGroup,
  Label,
} from "@vseth/components";
import {
  Button,
  CloseButton,
  Grid,
  List,
  TextInput,
} from "@mantine/core";
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
      <List>
        {users.map(user => (
          <div key={user}>
            <CloseButton onClick={() => remove(user)} />
            {user}
          </div>
        ))}
      </List>
      <Form
        onSubmit={e => {
          e.preventDefault();
          onAdd();
        }}
      >
        <Grid className="mt-2">
          <Grid.Col>
            <TextInput
              label="Name"
              value={username}
              onChange={e => setUsername(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col md={2}>
            <FormGroup>
              <Label for="Meta 2" className="form-input-label">
                &nbsp;
              </Label>
              <Button fullWidth type="submit">
                Add
              </Button>
            </FormGroup>
          </Grid.Col>
        </Grid>
      </Form>
    </>
  );
};
export default UserSetEditor;
