import {css} from "glamor";

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
}
