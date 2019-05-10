import {css} from "glamor";
import Colors from "./colors";

export default class GlobalCSS {
  static readonly noLinkColor = css({
    "& a": {
      ":link": {
        color: "inherit"
      },
      ":visited": {
        color: "inherit"
      }
    }
  });

  static readonly button = {
    cursor: "pointer",
    background: Colors.buttonBackground,
    padding: "7px 14px",
    border: "1px solid " + Colors.buttonBorder,
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
    borderRadius: "2px",
    margin: "5px",
  };

  static readonly buttonCss = css(GlobalCSS.button);
}
