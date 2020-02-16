import * as React from "react";
import { Link } from "react-router-dom";
import { css } from "glamor";
import Colors from "../colors";
import { fetchapi } from "../fetch-utils";
import { Menu } from "react-feather";

interface Props {
  username?: string;
  displayName?: string;
}

interface State {
  notificationCount: number;
  forceMenuVisibility: boolean;
}

const linkStyle = {
  ":link": {
    color: Colors.headerForeground,
  },
  ":visited": {
    color: Colors.headerForeground,
  },
};
const styles = {
  wrapper: css({
    zIndex: "100",
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    color: Colors.headerForeground,
    background: Colors.headerBackground,
    minHeight: "100px",
    overflow: "hidden",
    boxShadow: Colors.headerShadow,
    marginBottom: "10px",
    "@media (max-width: 799px)": {
      display: "block",
    },
  }),
  logotitle: css({
    display: "flex",
    alignItems: "center",
    "@media (max-width: 799px)": {
      marginTop: "20px",
      marginBottom: "20px",
    },
  }),
  logo: css({
    height: "54px",
    marginLeft: "30px",
    "@media (max-width: 799px)": {
      height: "34px",
    },
  }),
  title: css({
    flexGrow: "1",
    marginLeft: "30px",
    fontSize: "32px",
    fontWeight: "bold",
    "& a": linkStyle,
    "@media (max-width: 799px)": {
      fontSize: "20px",
    },
  }),
  hamburger: css({
    display: "none",
    padding: "1em",
    "@media (max-width: 799px)": {
      display: "inline-block",
    },
    "& svg": {
      verticalAlign: "-0.3em",
    },
  }),
  activeMenuWrapper: css({
    "@media (max-width: 799px)": {
      display: "block",
    },
  }),
  inactiveMenuWrapper: css({
    "@media (max-width: 799px)": {
      display: "none",
    },
  }),
  menuWrapper: css({
    display: "flex",
    alignItems: "center",
  }),
  menuitem: css({
    display: "block",
    marginRight: "40px",
    fontSize: "24px",
    "& a": linkStyle,
    "@media (max-width: 799px)": {
      fontSize: "20px",
      textAlign: "center",
      padding: "10px",
      marginRight: "0",
    },
  }),
};

export default class Header extends React.Component<Props, State> {
  state: State = {
    notificationCount: 0,
    forceMenuVisibility: false,
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
    fetchapi("/api/notifications/unreadcount")
      .then(res => {
        this.setState({
          notificationCount: res.value,
        });
      })
      .catch(() => undefined);
  };

  toggleMenu = () => {
    this.setState(prevState => ({
      forceMenuVisibility: !prevState.forceMenuVisibility,
    }));
  };

  render() {
    return (
      <div {...styles.wrapper}>
        <div {...styles.logotitle}>
          <div>
            <Link to="/">
              <img
                {...styles.logo}
                src="https://static.vis.ethz.ch/img/spirale_yellow.svg"
                alt="VIS Spiral Logo"
              />
            </Link>
          </div>
          <div {...styles.title}>
            <Link to="/">VIS Community Solutions</Link>
          </div>
          <div {...styles.hamburger} onClick={this.toggleMenu}>
            <Menu />
          </div>
        </div>
        <div
          {...styles.menuWrapper}
          {...(this.state.forceMenuVisibility
            ? styles.activeMenuWrapper
            : styles.inactiveMenuWrapper)}
        >
          <div {...styles.menuitem}>
            <Link to="/feedback">Feedback</Link>
          </div>
          <div {...styles.menuitem}>
            <Link to="/scoreboard">Scoreboard</Link>
          </div>
          <div {...styles.menuitem}>
            <Link to={`/user/${this.props.username}`}>
              {this.props.displayName}
              {this.state.notificationCount > 0
                ? " (" + this.state.notificationCount + ")"
                : ""}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
