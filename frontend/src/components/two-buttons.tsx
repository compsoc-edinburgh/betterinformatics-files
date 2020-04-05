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
  fill?: "left" | "right";
}> = ({ left, right, fill }) => {
  return (
    <div className={flex}>
      <div style={{ flexGrow: fill === "left" ? 1 : 0 }}>{left}</div>
      <div style={{ flexGrow: fill === "right" ? 1 : 0 }}>{right}</div>
    </div>
  );
};
export default TwoButtons;
