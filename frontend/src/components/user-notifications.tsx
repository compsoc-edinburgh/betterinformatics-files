import { Button, Alert, Loader } from "@mantine/core";
import React, { useState } from "react";
import { useNotifications } from "../api/hooks";
import NotificationComponent from "./notification";

interface UserNotificationsProps {
  username: string;
}
const UserNotifications: React.FC<UserNotificationsProps> = ({ username }) => {
  const [showRead, setShowRead] = useState(false);
  const [notificationsError, notificationsLoading, notifications] =
    useNotifications(showRead ? "all" : "unread");
  const error = notificationsError;
  return (
    <div>
      <h3>Notifications</h3>
      {error && <Alert color="red">{error.toString()}</Alert>}
      <Button mb="sm" onClick={() => setShowRead(prev => !prev)}>
        {showRead ? "Show unread" : "Show all"}
      </Button>
      {(!notifications || notifications.length === 0) && (
        <Alert my="sm" color="gray">
          No notifications
        </Alert>
      )}
      {notificationsLoading && <Loader />}
      {notifications &&
        notifications.map(notification => (
          <NotificationComponent
            notification={notification}
            key={notification.oid}
          />
        ))}
    </div>
  );
};
export default UserNotifications;
