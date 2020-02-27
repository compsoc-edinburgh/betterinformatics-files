import { ImageHandle } from "./utils/types";
import * as React from "react";
import { css } from "emotion";
import { Image, X } from "react-feather";

const removeIconStyle = css`
  margin: 0;
  border: none;
  cursor: pointer;
  background-color: transparent;
  padding-left: 6px;
  font-size: 12px;
  display: inline-block;
  color: rgba(0, 0, 0, 0.4);
`;
const wrapperStyle = css`
  text-align: right;
`;

interface Props {
  handle: ImageHandle;
  onDelete: () => void;
}
const Attachment: React.FC<Props> = ({ handle, onDelete }) => {
  return (
    <div className={wrapperStyle}>
      <button className={removeIconStyle} onClick={onDelete}>
        <Image size={14} />
        {handle.name}
      </button>
      <button className={removeIconStyle} onClick={onDelete}>
        <X size={14} />
      </button>
    </div>
  );
};
export default Attachment;
