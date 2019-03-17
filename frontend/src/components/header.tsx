import * as React from "react";
import {Link} from "react-router-dom";
import {css} from "glamor";
import Colors from "../colors";

interface Props {
  username?: string;
  displayName?: string;
}

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
    "& a": {
      ":link": {
        color: Colors.headerForeground
      },
      ":visited": {
        color: Colors.headerForeground
      }
    }
  }),
  feedback: css({
    display: "block",
    marginRight: "25px",
    "& a": {
      ":link": {
        color: Colors.headerForeground
      },
      ":visited": {
        color: Colors.headerForeground
      }
    }
  }),
  username: css({
    display: "block",
    marginRight: "25px",
    "& a": {
        ":link": {
            color: Colors.headerForeground
        },
        ":visited": {
            color: Colors.headerForeground
        }
    }
  })
};

export default ({username, displayName}: Props) => (
  <div {...styles.wrapper}>
    <div {...styles.logotitle}>
      <div><Link to="/"><img {...styles.logo} src="https://static.vis.ethz.ch/img/spirale_yellow.svg" alt="VIS Spiral Logo" /></Link></div>
      <div {...styles.title} {...styles.centerVertically}><Link to="/">VIS Community Solutions</Link></div>
    </div>
    <div {...styles.centerVertically}>
      <div {...styles.feedback}><Link to="/feedback">Feedback</Link></div>
      <div {...styles.username}><Link to={`/user/${username}`}>{displayName}</Link></div>
    </div>
  </div>
);
