import { css } from "emotion";
import React from "react";
const flex = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
`;
const grow = css`
  flex-grow: 1;
`;
const TwoButtons: React.FC<{
  left?: React.ReactNode;
  right?: React.ReactNode;
  fill?: "left" | "right";
}> = ({ left, right, fill }) => {
  return (
    <div className={flex}>
      <div className={fill === "left" ? grow : ""}>{left}</div>
      <div className={fill === "right" ? grow : ""}>{right}</div>
    </div>
  );
};
export default TwoButtons;
