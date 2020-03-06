import * as React from "react";
import { NotificationInfo } from "../interfaces";
import moment from "moment";
import { css } from "glamor";
import { fetchpost } from "../fetch-utils";
import Colors from "../colors";
import { Link } from "react-router-dom";
import MarkdownText from "./markdown-text";
import globalcss from "../globalcss";
import GlobalConsts from "../globalconsts";

interface Props {
  notification: NotificationInfo;
}

const styles = {
  wrapper: css({
    background: Colors.cardBackground,
    padding: "10px",
    marginBottom: "20px",
    boxShadow: Colors.cardShadow,
    maxWidth: "500px",
    "@media (max-width: 699px)": {
      padding: "5px",
    },
  }),
  header: css({
    fontSize: "24px",
    marginBottom: "10px",
    marginLeft: "-10px",
    marginRight: "-10px",
    marginTop: "-10px",
    padding: "10px",
    background: Colors.cardHeader,
    color: Colors.cardHeaderForeground,
  }),
  subtitle: css({
    fontSize: "16px",
  }),
  unread: css({
    fontWeight: "bold",
  }),
};

export default class NotificationComponent extends React.Component<Props> {
  readNotification = (notification: NotificationInfo) => {
    fetchpost("/api/notifications/setread", {
      read: 1,
      notificationoid: notification.oid,
    });
  };

  render() {
    const { notification } = this.props;
    return (
      <div {...styles.wrapper}>
        <Link
          to={notification.link}
          onClick={() => this.readNotification(notification)}
        >
          <div {...styles.header}>
            <div {...(notification.read ? undefined : styles.unread)}>
              {notification.title}
            </div>
            <div {...globalcss.noLinkColor} {...styles.subtitle}>
              <Link to={notification.sender}>
                {notification.senderDisplayName}
              </Link>{" "}
              •{" "}
              {moment(notification.time, GlobalConsts.momentParseString).format(
                GlobalConsts.momentFormatString,
              )}
            </div>
          </div>
        </Link>
        <MarkdownText value={notification.message} />
      </div>
    );
  }
}
