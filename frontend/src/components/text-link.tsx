import { css } from "glamor";
import { Link, LinkProps } from "react-router-dom";
import * as React from "react";

const styles = {
  inheritStyle: css({
    color: "inherit",
    textDecoration: "inherit",
    "&:link": {
      color: "inherit",
      textDecoration: "inherit",
    },
    "&:hover": {
      color: "inherit",
      textDecoration: "inherit",
    },
    "&:visited": {
      color: "inherit",
      textDecoration: "inherit",
    },
  }),
};
export const TextLink: React.FC<LinkProps> = props => {
  return <Link {...props} {...styles.inheritStyle} />;
};
export default TextLink;
