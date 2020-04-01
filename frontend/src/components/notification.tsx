import { useInViewport } from "@umijs/hooks";
import { Card, CardBody, CardHeader, Alert } from "@vseth/components";
import moment from "moment";
import * as React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlobalConsts from "../globalconsts";
import { useMarkAsRead } from "../api/hooks";
import { NotificationInfo } from "../interfaces";
import MarkdownText from "./markdown-text";
interface Props {
  notification: NotificationInfo;
}

const NotificationComponent: React.FC<Props> = ({ notification }) => {
  const [inViewport, ref] = useInViewport<HTMLDivElement>();
  const visible = inViewport || false;
  const [read, setRead] = useState(notification.read);
  useEffect(() => {
    setRead(notification.read);
  }, [notification]);
  const [error, , markAsRead] = useMarkAsRead();
  useEffect(() => {
    if (visible && !read) {
      setRead(true);
      markAsRead(notification.oid);
    }
  }, [markAsRead, read, visible, notification.oid]);
  return (
    <div ref={ref}>
      {error && <Alert color="danger">{error.message}</Alert>}
      <Card style={{ marginTop: "2em", marginBottom: "2em" }}>
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
