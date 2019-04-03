import * as React from "react";
import {fetchapi, fetchpost} from "../fetch-utils";
import {NotificationInfo} from "../interfaces";
import NotificationComponent from "../components/notification";

interface Props {
  isMyself: boolean;
  username: string;
}

interface State {
  displayName: string;
  score: number;
  showAll: boolean;
  notifications: NotificationInfo[];
  enabledNotifications: number[];
  error?: string;
}

export default class UserInfo extends React.Component<Props, State> {

  state: State = {
    displayName: "Loading...",
    score: 0,
    showAll: false,
    notifications: [],
    enabledNotifications: [],
  };

  componentDidMount() {
    fetchapi('/api/userinfo/' + this.props.username)
      .then(res => res.json())
      .then(res => {
        this.setState({
          displayName: res.value.displayName,
          score: res.value.score,
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
    if (this.props.isMyself) {
      this.loadUnreadNotifications();
      this.loadEnabledNotifications();
    }
  }

  componentDidUpdate(prevProps: Props) {
    document.title = this.state.displayName + " - VIS Community Solutions";
    if (!prevProps.isMyself && this.props.isMyself) {
      this.loadUnreadNotifications();
      this.loadEnabledNotifications();
    }
  }

  loadEnabledNotifications = () => {
    fetchapi('/api/notifications/getenabled')
      .then(res => res.json())
      .then(res => {
        this.setState({
          enabledNotifications: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  loadUnreadNotifications = () => {
    fetchapi('/api/notifications/unread')
      .then(res => res.json())
      .then(res => {
        this.setState({
          notifications: res.value
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString()
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
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  setNotificationEnabled = (type: number, enabled: boolean) => {
    fetchpost('/api/notifications/setenabled', {
      type: type,
      enabled: enabled ? 1 : 0,
    })
      .then(() => {
        this.loadEnabledNotifications();
      });
  };

  markAllRead = () => {
    Promise.all(
      this.state.notifications
        .filter(notification => !notification.read)
        .map(notification =>
          fetchpost('/api/notifications/setread', {
            read: 1,
            notificationoid: notification.oid,
          })
            .catch(err => {
              this.setState({
                error: err.toString()
              });
            })
        )
    )
      .then(() => {
        if (this.state.showAll) {
          this.loadAllNotifications();
        } else {
          this.loadUnreadNotifications();
        }
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  // TODO fix user not changing if clicked from this page

  render() {
    return (
      <div>
        {this.state.error && <p>{this.state.error}</p>}
        <h1>{this.state.displayName}</h1>
        <p>Score: {this.state.score}</p>
        {this.props.isMyself && <div>
          <h2>Notification Settings</h2>
          <div>
            <p><input type="checkbox" checked={this.state.enabledNotifications.indexOf(1) !== -1} onChange={(ev) => this.setNotificationEnabled(1, ev.target.checked)}/> Comment to my answer</p>
            <p><input type="checkbox" checked={this.state.enabledNotifications.indexOf(2) !== -1} onChange={(ev) => this.setNotificationEnabled(2, ev.target.checked)}/> Comment to my comment</p>
            <p><input type="checkbox" checked={this.state.enabledNotifications.indexOf(3) !== -1} onChange={(ev) => this.setNotificationEnabled(3, ev.target.checked)}/> Other answer to same question</p>
          </div>
          <h2>Notifications</h2>
          {this.state.notifications.reverse().map(notification => (
            <NotificationComponent notification={notification} key={notification.oid}/>
          ))}
          <div>
            {(!this.state.showAll) && <button onClick={this.loadAllNotifications}>Show All Notifications</button>}
            {(this.state.notifications.filter(notification => !notification.read).length > 0) &&
            <button onClick={this.markAllRead}>Mark All Read</button>}
          </div>
        </div>}
      </div>
    );
  }
};
