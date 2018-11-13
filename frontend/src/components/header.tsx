import * as React from "react";
import {Link} from "react-router-dom";
import {css} from "glamor";

interface Props {
  username?: string;
}

const styles = {
  wrapper: css({
    display: "flex",
    justifyContent: "space-between",
    color: "#ffffff",
    background: "#394b59",
    '& a': {
      'text-decoration': 'none',
      ':link': {
        color: 'inherit'
      },
      ':visited': {
        color: 'inherit'
      }
    }
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
    justifyContent: "center",
    flexDirection: "column"
  }),
  title: css({
    marginLeft: "25px",
    fontSize: "24px",
  }),
  username: css({
    display: "block",
    marginRight: "25px"
  })
};

export default ({username}: Props) => (
  <div {...styles.wrapper}>
    <div {...styles.logotitle}>
      <div><Link to="/"><img {...styles.logo} src="https://static.vis.ethz.ch/img/spirale_yellow.svg" alt="VIS Spiral Logo" /></Link></div>
      <div {...styles.title} {...styles.centerVertically}><Link to="/">VIS Community Solutions</Link></div>
    </div>
    <div {...styles.centerVertically}><div {...styles.username}>{username}</div></div>
  </div>
);
