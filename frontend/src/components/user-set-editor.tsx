import { Button, Grid, Group, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Icon, ICONS } from "vseth-canine-ui";

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
      <Group>
        {users.map(user => (
          <Button
            key={user}
            variant="default"
            leftIcon={<Icon icon={ICONS.CLOSE} />}
            onClick={() => remove(user)}
          >
            {user}
          </Button>
        ))}
      </Group>
      <form
        onSubmit={e => {
          e.preventDefault();
          onAdd();
        }}
      >
        <Grid align="flex-end" my="xs">
          <Grid.Col span="auto">
            <TextInput
              label="Name"
              value={username}
              onChange={e => setUsername(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col md={2}>
            <Button fullWidth type="submit">
              Add
            </Button>
          </Grid.Col>
        </Grid>
      </form>
    </>
  );
};
export default UserSetEditor;
