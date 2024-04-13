import classes from "./grid.module.css";
import React from "react";

interface GridProps {
  children?: React.ReactNode;
}

const Grid: React.FC<GridProps> = ({ children }) => {
  return <div className={classes.grid}>{children}</div>;
};
export default Grid;
