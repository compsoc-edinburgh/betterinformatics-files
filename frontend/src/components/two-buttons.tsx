import { css } from "emotion";
import React from "react";
const flex = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
`;
const TwoButtons: React.FC<{
  left?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ left, right }) => {
  return (
    <div className={flex}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
};
export default TwoButtons;
