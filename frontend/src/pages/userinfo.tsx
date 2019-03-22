import * as React from "react";
import {fetchapi, fetchpost} from "../fetch-utils";
import {NotificationInfo} from "../interfaces";
import {Link} from "react-router-dom";
import * as moment from "moment";

interface Props {
  isMyself: boolean;
  username: string;
}

interface State {
  displayName: string;
  score: number;
  showAll: boolean;
  notifications: NotificationInfo[];
  error?: string;
}

export default class UserInfo extends React.Component<Props, State> {

  state: State = {
    displayName: "Loading...",
    score: 0,
    showAll: false,
    notifications: [],
  };

  async componentWillMount() {
    fetchapi('/api/userinfo/' + this.props.username)
      .then(res => res.json())
      .then(res => {
        this.setState({
          displayName: res.value.displayName,
          score: res.value.score,
        });
      });
    if (this.props.isMyself) {
      this.loadUnreadNotifications();
    } else {
      setTimeout(() => {
        if (this.props.isMyself && !this.state.showAll) {
          // maybe the props 'isMyself' changed
          this.loadUnreadNotifications();
        }
      }, 700); // dirty hack to handle direct links to this page
    }
  }

  loadUnreadNotifications = () => {
    fetchapi('/api/notifications/unread')
      .then(res => res.json())
      .then(res => {
        this.setState({
          notifications: res.value
        });
      });
  };

  loadAllNotifications = () => {
    fetchapi('/api/notifications/all')
      .then(res => res.json())
      .then(res => {
        this.setState({
          showAll: true,
          notifications: res.value,
        });
      });
  };

  readNotification = (notification: NotificationInfo) => {
    fetchpost('/api/notifications/setread', {
      read: 1,
      notificationoid: notification.oid,
    });
  };

  // TODO implement notification settings
  // TODO correctly render comments
  // TODO style everything

  render() {
    return (
      <div>
        {this.state.error && <p>{this.state.error}</p>}
        <h1>{this.state.displayName}</h1>
        <p>Score: {this.state.score}</p>
        {this.props.isMyself && <div>
          <h2>Notification Settings</h2>
          <h2>Notifications</h2>
          {this.state.notifications.map(notification => (
            <div key={notification.oid}>
              <div><Link to={notification.link} onClick={() => this.readNotification(notification)}>{notification.title}</Link></div>
              <div><Link to={notification.sender}>{notification.senderDisplayName}</Link> @ {moment(notification.time, "YYYY-MM-DDTHH:mm:ss.SSSSSSZZ").format("DD.MM.YYYY HH:mm")}</div>
              <div>{notification.message}</div>
            </div>
          ))}
          {(!this.state.showAll) && <div>
            <button onClick={this.loadAllNotifications}>Show All Notifications</button>
          </div>}
        </div>}
      </div>
    );
  }
};
