import { Alert, Button, FormGroup, Label, Spinner } from "@vseth/components";
import React, { useEffect, useState } from "react";
import { useUser } from "../auth";
import {
  useEnabledNotifications,
  useMarkAsRead,
  useNotifications,
  useSetEnabledNotifications,
} from "../hooks/api";
import NotificationComponent from "./notification";

interface UserNotificationsProps {
  username: string;
}
const UserNotifications: React.FC<UserNotificationsProps> = ({ username }) => {
  const user = useUser()!;
  const isMyself = username === user.username;
  const [showRead, setShowRead] = useState(false);
  const [
    notificationsError,
    notificationsLoading,
    notifications,
  ] = useNotifications(showRead ? "all" : "unread");
  const [
    enabledError,
    enabledLoading,
    enabled,
    reloadEnabled,
  ] = useEnabledNotifications(isMyself);
  const [
    setEnabledError,
    setEnabledLoading,
    setEnabled,
  ] = useSetEnabledNotifications(reloadEnabled);
  const [markAsReadError, markAsReadLoading, markAsRead] = useMarkAsRead();
  const error =
    notificationsError || enabledError || setEnabledError || markAsReadError;
  const checkboxLoading = enabledLoading || setEnabledLoading;
  useEffect(() => {
    if (markAsReadLoading || markAsReadError) return;
    if (isMyself && notifications) {
      const unread = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.oid);
      if (unread.length === 0) return;
      markAsRead(...unread);
    }
  }, [isMyself, notifications, markAsRead, markAsReadLoading, markAsReadError]);

  return (
    <>
      <h2>Notifications</h2>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <FormGroup check>
        <Label>
          <input
            type="checkbox"
            checked={enabled ? enabled.has(1) : false}
            disabled={checkboxLoading}
            onChange={e => setEnabled(1, e.currentTarget.checked)}
          />{" "}
          Comment to my answer
        </Label>
      </FormGroup>
      <FormGroup check>
        <Label>
          <input
            type="checkbox"
            checked={enabled ? enabled.has(2) : false}
            disabled={checkboxLoading}
            onChange={e => setEnabled(2, e.currentTarget.checked)}
          />{" "}
          Comment to my comment
        </Label>
      </FormGroup>
      <FormGroup check>
        <Label>
          <input
            type="checkbox"
            checked={enabled ? enabled.has(3) : false}
            disabled={checkboxLoading}
            onChange={e => setEnabled(3, e.currentTarget.checked)}
          />{" "}
          Other answer to same question
        </Label>
      </FormGroup>
      {(notificationsLoading || markAsReadLoading) && <Spinner />}
      {notifications &&
        notifications.map(notification => (
          <NotificationComponent
            notification={notification}
            key={notification.oid}
          />
        ))}
      <div>
        <Button onClick={() => setShowRead(prev => !prev)}>
          {showRead ? "Hide Read Notifications" : "Show Read Notifications"}
        </Button>
      </div>
    </>
  );
};
export default UserNotifications;
