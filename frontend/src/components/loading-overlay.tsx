import { Spinner } from "@vseth/components";
import { css, cx } from "emotion";
import React from "react";

const style = css`
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 42;
  transition: background-color 1s;
`;
const inactiveStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0);
  z-index: 42;
  transition: background-color 1s;
`;
const LoadingOverlay: React.FC<{ loading: boolean }> = ({ loading }) => {
  return (
    <div className={loading ? style : inactiveStyle}>
      <div className="position-center">
        <Spinner />
      </div>
    </div>
  );
};
export default LoadingOverlay;
