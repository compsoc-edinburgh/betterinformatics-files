import React from "react";
import { css } from "emotion";
interface Props {}
const contentContainerBg = css`
  background-color: #fafafa;
`;
const ContentContainer: React.FC<Props> = ({ children }) => {
  return (
    <div
      className={`border-gray-300 border-top border-bottom py-5 px-0 my-3 ${contentContainerBg}`}
    >
      {children}
    </div>
  );
};
export default ContentContainer;
