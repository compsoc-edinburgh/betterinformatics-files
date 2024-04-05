import { CardProps, Card } from "@mantine/core";
import classes from "./button-wrapper-card.module.css";
import React from "react";

const ButtonWrapperCard: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <Card className={classes.wrapperStyle} {...props}>
      {children}
    </Card>
  );
};

export default ButtonWrapperCard;
