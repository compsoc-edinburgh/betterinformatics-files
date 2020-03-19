import { ButtonGroup, Button } from "@vseth/components";
import React from "react";
interface Props {
  currentScore: number;
}
const Score: React.FC<Props> = ({ currentScore }) => {
  return (
    <ButtonGroup>
      <Button size="sm">-</Button>
      <Button size="sm" disabled color="white">
        {currentScore}
      </Button>
      <Button size="sm">+</Button>
    </ButtonGroup>
  );
};
export default Score;
