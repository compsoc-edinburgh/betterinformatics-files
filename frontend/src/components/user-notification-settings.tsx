import { Alert, Checkbox, Stack } from "@mantine/core";
import React from "react";
import {
  useEnabledNotifications,
  useSetEnabledNotifications,
} from "../api/hooks";

interface UserNotificationsProps {
  username: string;
}
const UserNotificationsSettings: React.FC<UserNotificationsProps> = ({
  username,
}) => {
  const [enabledError, enabledLoading, enabled, reloadEnabled] =
    useEnabledNotifications(true);
  const [setEnabledError, setEnabledLoading, setEnabled] =
    useSetEnabledNotifications(reloadEnabled);
  const error = enabledError || setEnabledError;
  const checkboxLoading = enabledLoading || setEnabledLoading;
  return (
    <>
      <h3>Notifications</h3>
      {error && <Alert color="red">{error.toString()}</Alert>}
      <Stack gap="sm">
        <Checkbox
          label="Comment to my answer"
          checked={enabled ? enabled.has(1) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(1, e.currentTarget.checked)}
        />
        <Checkbox
          label="Comment to my comment"
          checked={enabled ? enabled.has(2) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(2, e.currentTarget.checked)}
        />
        <Checkbox
          label="Other answer to same question"
          checked={enabled ? enabled.has(3) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(3, e.currentTarget.checked)}
        />
        <Checkbox
          label="Comment to my document"
          checked={enabled ? enabled.has(4) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(4, e.currentTarget.checked)}
        />
      </Stack>
    </>
  );
};
export default UserNotificationsSettings;
