import * as React from "react";
import classes from "./Container.module.css";

interface EditorContainerProps {
  children?: React.ReactNode;
}

const Container: React.FC<EditorContainerProps> = ({ children }) => {
  return <div className={classes.container}>{children}</div>;
};
export default Container;
