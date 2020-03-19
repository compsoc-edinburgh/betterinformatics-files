import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Button,
} from "@vseth/components";
import React from "react";
interface Props {
  currentScore: number;
}
const Score: React.FC<Props> = ({ currentScore }) => {
  return (
    <InputGroup size="sm">
      <InputGroupAddon addonType="prepend">
        <Button>-</Button>
      </InputGroupAddon>
      <InputGroupAddon addonType="append">
        <InputGroupText>12</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon addonType="append">
        <Button>+</Button>
      </InputGroupAddon>
    </InputGroup>
  );
};
export default Score;
