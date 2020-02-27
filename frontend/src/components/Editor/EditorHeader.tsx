import { EditorMode } from "./utils/types";
import * as React from "react";
import TabBar from "./TabBar";
import { css } from "emotion";
import {
  Image as ImageIcon,
  Bold,
  Italic,
  Link,
  Code,
  DollarSign,
} from "react-feather";

const iconButtonStyle = css`
  margin: 0;
  border: none;
  cursor: pointer;
  background-color: transparent;
  padding: 6px;
  color: rgba(0, 0, 0, 0.4);
  transition: color 0.1s;
  &:hover {
    color: rgba(0, 0, 0, 0.8);
  }
`;
const headerStyle = css`
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row;
  align-items: flex-end;
`;
const spacer = css`
  flex-grow: 1;
`;

interface Props {
  activeMode: EditorMode;
  onActiveModeChange: (newMode: EditorMode) => void;

  onMathClick: () => void;
  onCodeClick: () => void;
  onLinkClick: () => void;
  onItalicClick: () => void;
  onBoldClick: () => void;
  onImageClick: () => void;
}
const EditorHeader: React.FC<Props> = ({
  activeMode,
  onActiveModeChange,
  ...handlers
}) => {
  const iconSize = 15;
  return (
    <div className={headerStyle}>
      <TabBar
        items={[
          {
            title: "Write",
            active: activeMode === "write",
            onClick: () => onActiveModeChange("write"),
          },
          {
            title: "Preview",
            active: activeMode === "preview",
            onClick: () => onActiveModeChange("preview"),
          },
        ]}
      />
      <div className={spacer} />
      <button className={iconButtonStyle} onClick={handlers.onMathClick}>
        <DollarSign size={iconSize} />
      </button>
      <button className={iconButtonStyle} onClick={handlers.onCodeClick}>
        <Code size={iconSize} />
      </button>
      <button className={iconButtonStyle} onClick={handlers.onLinkClick}>
        <Link size={iconSize} />
      </button>
      <button className={iconButtonStyle} onClick={handlers.onItalicClick}>
        <Italic size={iconSize} />
      </button>
      <button className={iconButtonStyle} onClick={handlers.onBoldClick}>
        <Bold size={iconSize} />
      </button>
      <button className={iconButtonStyle} onClick={handlers.onImageClick}>
        <ImageIcon size={iconSize} />
      </button>
    </div>
  );
};
export default EditorHeader;
