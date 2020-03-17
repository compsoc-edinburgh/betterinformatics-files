import { css } from "glamor";
import React from "react";

const gridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gridColumnGap: "20px",
  gridRowGap: "20px",
});
const Grid: React.FC<{}> = ({ children }) => {
  return <div {...gridStyles}>{children}</div>;
};
export default Grid;
