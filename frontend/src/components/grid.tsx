import { css } from "emotion";
import React from "react";

const gridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-column-gap: 20px;
  grid-row-gap: 20px;
`;
const Grid: React.FC<{}> = ({ children }) => {
  return <div className={gridStyles}>{children}</div>;
};
export default Grid;
