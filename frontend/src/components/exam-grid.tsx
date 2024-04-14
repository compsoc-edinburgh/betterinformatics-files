import classes from "./exam-grid.module.css";
import React from "react";

interface ExamGridProps {
  children?: React.ReactNode;
}

const ExamGrid: React.FC<ExamGridProps> = ({ children }) => {
  return <div className={classes.grid}>{children}</div>;
};
export default ExamGrid;
