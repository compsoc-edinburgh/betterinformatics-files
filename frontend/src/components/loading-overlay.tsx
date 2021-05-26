import { Spinner } from "@vseth/components";
import React from "react";
const fadeIn = "";
const style = "";

const inactiveStyle = "";
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
