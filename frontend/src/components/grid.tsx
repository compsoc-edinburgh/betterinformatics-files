import { css } from "@emotion/css";
import React from "react";

const gridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-column-gap: 18px;
  grid-row-gap: 15px;
`;

interface GridProps {
  children?: React.ReactNode;
}

const Grid: React.FC<GridProps> = ({ children }) => {
  return <div className={gridStyles}>{children}</div>;
};
export default Grid;
