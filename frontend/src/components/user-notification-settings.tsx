import { Alert, Checkbox, Table } from "@mantine/core";
import React from "react";
import {
  useEnabledNotifications,
  useSetEnabledNotifications,
} from "../api/hooks";

interface UserNotificationsProps {
  username: string;
}

const mapTypeToString = (type: number) => {
  switch (type) {
    case 1:
      return "Comment to my answer";
    case 2:
      return "Comment to my comment";
    case 3:
      return "Other answer to same question";
    case 4:
      return "Comment to my document";
    default:
      return "Unknown";
  }
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
      <Table style={{ width: "auto" }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Notification type</Table.Th>
            <Table.Th>In-App</Table.Th>
            <Table.Th>Email</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {[1, 2, 3, 4].map(type => (
            <Table.Tr key={type}>
              <Table.Td>{mapTypeToString(type)}</Table.Td>
              <Table.Td>
                <Checkbox
                  checked={enabled ? enabled.some(v => v.enabled && v.type === type) : false}
                  disabled={checkboxLoading}
                  onChange={e => setEnabled(type, e.currentTarget.checked, undefined)}
                />
              </Table.Td>
              <Table.Td>
                <Checkbox
                  checked={enabled ? enabled.some(v => v.email_enabled && v.type === type) : false}
                  disabled={checkboxLoading}
                  onChange={e => setEnabled(type, undefined, e.currentTarget.checked)}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
};
export default UserNotificationsSettings;
