import { Alert, Checkbox, Stack, Table } from "@mantine/core";
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
      <Table style={{ width: "auto" }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Notification type</Table.Th>
            <Table.Th>In-App</Table.Th>
            <Table.Th>Email</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Comment to my answer</Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.enabled && v.type == 1) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(1, e.currentTarget.checked, undefined)}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.email_enabled && v.type == 1) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(1, undefined, e.currentTarget.checked)}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Comment to my comment</Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.enabled && v.type == 2) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(2, e.currentTarget.checked, undefined)}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.email_enabled && v.type == 2) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(2, undefined, e.currentTarget.checked)}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Other answer to same question</Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.enabled && v.type == 3) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(3, e.currentTarget.checked, undefined)}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.email_enabled && v.type == 3) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(3, undefined, e.currentTarget.checked)}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Comment to my document</Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.enabled && v.type == 4) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(4, e.currentTarget.checked, undefined)}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={enabled ? enabled.some(v => v.email_enabled && v.type == 4) : false}
                disabled={checkboxLoading}
                onChange={e => setEnabled(4, undefined, e.currentTarget.checked)}
              />
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </>
  );
};
export default UserNotificationsSettings;
