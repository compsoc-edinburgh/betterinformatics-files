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
  menuVisibleOnMobile: boolean;
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
    cursor: "pointer",
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    "&:hover": {
      backgroundColor: "transparent",
      border: "none",
    },
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
    menuVisibleOnMobile: false,
  };
  notificationInterval: number | undefined;

  componentDidMount() {
    if (this.props.username !== "") {
      this.setupInterval();
    }
  }
  componentDidUpdate(prevProps: Props, _prevState: State) {
    if (prevProps.username === "" && this.props.username !== "") {
      this.setupInterval();
    }
    if (prevProps.username !== "" && this.props.username === "") {
      window.clearInterval(this.notificationInterval);
    }
  }
  setupInterval() {
    this.notificationInterval = window.setInterval(
      this.checkNotificationCount,
      60000,
    );
    this.checkNotificationCount();
  }

  componentWillUnmount() {
    clearInterval(this.notificationInterval);
  }

  checkNotificationCount = () => {
    fetchapi("/api/notification/unreadcount/")
      .then(res => {
        this.setState({
          notificationCount: res.value,
        });
      })
      .catch(() => undefined);
  };

  toggleMenu = () => {
    this.setState(prevState => ({
      menuVisibleOnMobile: !prevState.menuVisibleOnMobile,
    }));
  };

  linkClicked = () => {
    this.setState({
      menuVisibleOnMobile: false,
    });
  };

  render() {
    return (
      <div {...styles.wrapper}>
        <div {...styles.logotitle}>
          <div>
            <Link to="/" onClick={this.linkClicked}>
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
          <button {...styles.hamburger} onClick={this.toggleMenu}>
            <Menu />
          </button>
        </div>
        <div
          {...styles.menuWrapper}
          {...(this.state.menuVisibleOnMobile
            ? styles.activeMenuWrapper
            : styles.inactiveMenuWrapper)}
        >
          <div {...styles.menuitem}>
            <Link to="/faq" onClick={this.linkClicked}>
              FAQ
            </Link>
          </div>
          <div {...styles.menuitem}>
            <Link to="/feedback" onClick={this.linkClicked}>
              Feedback
            </Link>
          </div>
          <div {...styles.menuitem}>
            <Link to="/scoreboard" onClick={this.linkClicked}>
              Scoreboard
            </Link>
          </div>
          <div {...styles.menuitem}>
            <Link
              to={`/user/${this.props.username}`}
              onClick={this.linkClicked}
            >
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
