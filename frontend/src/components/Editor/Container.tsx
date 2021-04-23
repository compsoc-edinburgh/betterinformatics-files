import * as React from "react";
import { css } from "@emotion/css";
const containerStyle = css`
  width: 100%;
  max-width: 600px;
  margin: auto;
  padding: 1em;
  box-sizing: border-box;
`;

const Container: React.FC<{}> = ({ children }) => {
  return <div className={containerStyle}>{children}</div>;
};
export default Container;
