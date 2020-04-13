import React from "react";
interface Props {}
const ContentContainer: React.FC<Props> = ({ children }) => {
  return (
    <div
      className="border-gray-300 border-top border-bottom py-5 px-0 my-3"
      style={{ backgroundColor: "#fafafa" }}
    >
      {children}
    </div>
  );
};
export default ContentContainer;
