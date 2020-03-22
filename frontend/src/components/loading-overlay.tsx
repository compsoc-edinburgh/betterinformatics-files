import { Spinner } from "@vseth/components";
import { css } from "emotion";
import React from "react";

const style = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 42;
`;
const container = css`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;
const LoadingOverlay: React.FC<{ loading: boolean }> = ({ loading }) => {
  if (!loading) return null;
  return (
    <div className={style}>
      <div className={container}>
        <Spinner />
      </div>
    </div>
  );
};
export default LoadingOverlay;
