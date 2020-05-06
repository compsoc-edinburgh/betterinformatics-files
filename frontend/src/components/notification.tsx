import { Alert, Card, CardBody, CardHeader } from "@vseth/components";
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
    markAllAsRead(notification.oid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.oid]);

  return (
    <div>
      {error && <Alert color="danger">{error.message}</Alert>}
      <Card className="my-2">
        <CardHeader>
          <h6>
            <Link to={notification.link}>{notification.title}</Link>
            <div>
              <small>
                <Link to={notification.sender}>
                  {notification.senderDisplayName}
                </Link>{" "}
                •{" "}
                {moment(
                  notification.time,
                  GlobalConsts.momentParseString,
                ).format(GlobalConsts.momentFormatString)}
              </small>
            </div>
          </h6>
        </CardHeader>
        <CardBody>
          <MarkdownText value={notification.message} />
        </CardBody>
      </Card>
    </div>
  );
};
export default NotificationComponent;
