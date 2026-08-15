import { Button, Grid, Group } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import UserSelect from "./user-select.js";
import { UserSchema } from "../api/model/userSchema.js";

interface UserSetEditorProps {
  users: readonly string[];
  setUsers: (newUsers: string[]) => void;
}
const UserSetEditor: React.FC<UserSetEditorProps> = ({ users, setUsers }) => {
  const [user, setUser] = useState<UserSchema | null>(null);
  const onAdd = () => {
    setUser(null);
    if (!user || users.includes(user.username)) return;
    setUsers([...users, user.username]);
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
            leftSection={<IconX />}
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
            <UserSelect
              label="Name"
              value={user}
              onChange={user => setUser(user)}
              filter={user => !users.includes(user.username)}
            />
          </Grid.Col>
          <Grid.Col span={{ md: 2 }}>
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
