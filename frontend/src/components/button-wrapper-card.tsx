import { CardProps, Card, CardHeader } from "@vseth/components";
import styled from "@emotion/styled";
import React from "react";
const Wrapper = styled(Card)`
  margin-top: 1em;
  margin-bottom: 1em;
`;
const ButtonWrapperCard: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <Wrapper {...props}>
      <CardHeader>{children}</CardHeader>
    </Wrapper>
  );
};

export default ButtonWrapperCard;
