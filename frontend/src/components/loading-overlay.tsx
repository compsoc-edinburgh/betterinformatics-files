import { Spinner } from "@vseth/components";
import { css, keyframes } from "emotion";
import React from "react";
import GlobalConsts from "../globalconsts";
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const style = css`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: ${GlobalConsts.zIndex.imageOverlay};
  animation: ${fadeIn} 1s;
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
  z-index: ${GlobalConsts.zIndex.imageOverlay};
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
