import { Alert, Card, Divider } from "@mantine/core";
import moment from "moment";
import * as React from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMarkAllAsRead } from "../api/hooks";
import GlobalConsts from "../globalconsts";
import { NotificationInfo } from "../interfaces";
import MarkdownText from "./markdown-text";
interface Props {
  notification: NotificationInfo;
}

const NotificationComponent: React.FC<Props> = ({ notification }) => {
  const [error, , markAllAsRead] = useMarkAllAsRead();
  useEffect(() => {
    if (!notification.read) markAllAsRead(notification.oid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.oid, notification.read]);

  return (
    <div>
      {error && <Alert color="red">{error.message}</Alert>}
      <Card className="my-2">
        <h6>
          <Link to={notification.link} className="text-primary">
            {notification.title}
          </Link>
          <div>
            <small>
              <Link to={notification.sender} className="text-primary">
                {notification.senderDisplayName}
              </Link>{" "}
              •{" "}
              {moment(notification.time, GlobalConsts.momentParseString).format(
                GlobalConsts.momentFormatString,
              )}
            </small>
          </div>
        </h6>
        <Divider />
        <MarkdownText value={notification.message} />
      </Card>
    </div>
  );
};
export default NotificationComponent;
