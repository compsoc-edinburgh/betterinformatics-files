import * as React from "react";
import {Link} from "react-router-dom";
import {css} from "glamor";
import Colors from "../colors";
import {fetchapi} from "../fetch-utils";

interface Props {
  username?: string;
  displayName?: string;
}

interface State {
  notificationCount: number;
}

const linkStyle = {
  ":link": {
    color: Colors.headerForeground
  },
  ":visited": {
    color: Colors.headerForeground
  }
};
const styles = {
  wrapper: css({
    display: "flex",
    justifyContent: "space-between",
    color: Colors.headerForeground,
    background: Colors.headerBackground,
    overflow: "hidden",
  }),
  logotitle: css({
    display: "flex",
  }),
  logo: css({
    height: "30px",
    margin: "10px"
  }),
  centerVertically: css({
    display: "flex",
    alignItems: "center",
  }),
  title: css({
    marginLeft: "25px",
    fontSize: "24px",
    "& a": linkStyle,
  }),
  feedback: css({
    display: "block",
    marginRight: "25px",
    "& a": linkStyle,
  }),
  scoreboard: css({
    display: "block",
    marginRight: "25px",
    "& a": linkStyle,
  }),
  username: css({
    display: "block",
    marginRight: "25px",
    "& a": linkStyle,
  }),
};

export default class Header extends React.Component<Props> {

  state: State = {
    notificationCount: 0,
  };
  notificationInterval: NodeJS.Timer;

  componentDidMount() {
    this.notificationInterval = setInterval(this.checkNotificationCount, 60000);
    this.checkNotificationCount();
  }

  componentWillUnmount() {
    clearInterval(this.notificationInterval);
  }

  checkNotificationCount = () => {
    fetchapi('/api/notifications/unreadcount')
      .then(res => {
        this.setState({
          notificationCount: res.value
        });
      })
      .catch(() => undefined);
  };

  render() {
    return (
      <div {...styles.wrapper}>
        <div {...styles.logotitle}>
          <div><Link to="/"><img {...styles.logo} src="https://static.vis.ethz.ch/img/spirale_yellow.svg" alt="VIS Spiral Logo" /></Link></div>
          <div {...styles.title} {...styles.centerVertically}><Link to="/">VIS Community Solutions</Link></div>
        </div>
        <div {...styles.centerVertically}>
          <div {...styles.feedback}><Link to="/feedback">Feedback</Link></div>
          <div {...styles.scoreboard}><Link to="/scoreboard">Scoreboard</Link></div>
          <div {...styles.username}><Link to={`/user/${this.props.username}`}>{this.props.displayName}{this.state.notificationCount > 0 ? " (" + this.state.notificationCount + ")" : ""}</Link></div>
        </div>
      </div>
    );
  }
};