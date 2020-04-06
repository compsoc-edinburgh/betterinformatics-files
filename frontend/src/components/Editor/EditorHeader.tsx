import { EditorMode } from "./utils/types";
import * as React from "react";
import { css } from "emotion";
import { Bold, Italic, Link, Code, DollarSign } from "react-feather";
import { Nav, NavItem, NavLink } from "@vseth/components";

const iconButtonStyle = css`
  margin: 0;
  border: none;
  cursor: pointer;
  background-color: transparent;
  padding: 0 14px;
  height: 100%;
  color: rgba(0, 0, 0, 0.8);
  transition: color 0.1s;
  &:hover {
    color: rgba(0, 0, 0, 0.8);
  }
`;
const navStyle = css`
  width: 100%;
`;
const headerStyle = css`
  position: relative;
`;
const iconsStyle = css`
  position: absolute;
  bottom: 0;
  right: 0;
  top: 0;
`;
const linkStyle = css`
  font-size: 0.8rem !important;
`;

interface Props {
  activeMode: EditorMode;
  onActiveModeChange: (newMode: EditorMode) => void;

  onMathClick: () => void;
  onCodeClick: () => void;
  onLinkClick: () => void;
  onItalicClick: () => void;
  onBoldClick: () => void;
}
const EditorHeader: React.FC<Props> = ({
  activeMode,
  onActiveModeChange,
  ...handlers
}) => {
  const iconSize = 15;
  return (
    <div className={headerStyle}>
      <Nav tabs className={navStyle}>
        <NavItem>
          <NavLink
            active={activeMode === "write"}
            onClick={() => onActiveModeChange("write")}
            className={linkStyle}
          >
            Write
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            active={activeMode === "preview"}
            onClick={() => onActiveModeChange("preview")}
            className={linkStyle}
          >
            Preview
          </NavLink>
        </NavItem>
      </Nav>
      <div className={iconsStyle}>
        {activeMode === "write" && (
          <>
            <button
              className={iconButtonStyle}
              onClick={handlers.onMathClick}
              type="button"
            >
              <DollarSign size={iconSize} />
            </button>
            <button
              className={iconButtonStyle}
              onClick={handlers.onCodeClick}
              type="button"
            >
              <Code size={iconSize} />
            </button>
            <button
              className={iconButtonStyle}
              onClick={handlers.onLinkClick}
              type="button"
            >
              <Link size={iconSize} />
            </button>
            <button
              className={iconButtonStyle}
              onClick={handlers.onItalicClick}
              type="button"
            >
              <Italic size={iconSize} />
            </button>
            <button
              className={iconButtonStyle}
              onClick={handlers.onBoldClick}
              type="button"
            >
              <Bold size={iconSize} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default EditorHeader;
