import {
  ActionIcon,
  Loader,
  SimpleGrid,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import React, { useState } from "react";
import { useSetUserDisplayUsername } from "../api/hooks";
import { UserInfo } from "../interfaces";

interface UserDisplayNameProps {
  userInfo: UserInfo;
  reloadUserInfo: () => void;
}
const UserDisplayNameSettings: React.FC<UserDisplayNameProps> = ({
  userInfo,
  reloadUserInfo,
}: UserDisplayNameProps) => {
  const [editingDisplayUsername, setEditingDisplayUsername] = useState(
    userInfo.displayName || "",
  );
  const [error, loading, sendDisplayName] =
    useSetUserDisplayUsername(reloadUserInfo);

  const handleSubmitDisplayName = (e: any) => {
    e.preventDefault();
    sendDisplayName(editingDisplayUsername);
  };

  return (
    <>
      <h3>Display Username</h3>
      <Text mb="xs">
        You can choose to set a name that is displayed next to your UUN in
        comments and answers you submit. This is purely cosmetic, and does not
        hide your UUN from other users.
      </Text>
      <form onSubmit={handleSubmitDisplayName}>
        <SimpleGrid
          cols={{ xl: 4, sm: 1, md: 2 }}
        >
          <TextInput
            label="Display Username (max 32 characters)"
            placeholder="Leave empty to use your UUN"
            value={editingDisplayUsername}
            onChange={(e: any) =>
              setEditingDisplayUsername(e.currentTarget.value)
            }
            // Backend will return error if name is too long
            maxLength={32}
            error={error ? error.toString() : ""}
            rightSection={
              loading ? (
                <Loader size="xs" />
              ) : (
                <Tooltip withinPortal label="Submit">
                  <ActionIcon type="submit">
                    <IconCheck />
                  </ActionIcon>
                </Tooltip>
              )
            }
          />
        </SimpleGrid>
      </form>
    </>
  );
};
export default UserDisplayNameSettings;
