import { CardProps, Card } from "@mantine/core";
import { css } from "@emotion/css";
import React from "react";
const wrapperStyle = css`
  margin-top: 1em;
  margin-bottom: 1em;
`;
const ButtonWrapperCard: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <Card className={wrapperStyle} {...props}>
      {children}
    </Card>
  );
};

export default ButtonWrapperCard;
