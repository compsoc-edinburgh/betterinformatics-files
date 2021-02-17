import { Nav, NavItem, NavLink, Row, Col } from "@vseth/components";
import { css } from "emotion";
import * as React from "react";
import { Bold, Code, DollarSign, Italic, Link } from "react-feather";
import TooltipButton from "../TooltipButton";
import { EditorMode } from "./utils/types";

const iconButtonStyle = css`
  margin: 0;
  border: none;
  cursor: pointer;
  background-color: transparent;
  padding: 0 0.875rem;
  height: 100%;
  color: rgba(0, 0, 0, 0.8);
  transition: color 0.1s;
  min-width: 0;
  &:hover {
    color: rgba(0, 0, 0, 0.8);
  }
`;
const navStyle = css`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;
const headerStyle = css`
  position: relative;
`;
const linkStyle = css`
  font-size: 0.8rem !important;
`;
const tabContainer = css`
  display: flex;
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
        <div className={tabContainer}>
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
        </div>
        {activeMode === "write" && (
          <Row className="m-0 d-flex justify-content-center">
            <Col className="px-0">
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onMathClick}
                type="button"
                size="sm"
                tooltip="Inline Math"
              >
                <DollarSign size={iconSize} />
              </TooltipButton>
            </Col>
            <Col className="px-0">
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onCodeClick}
                type="button"
                size="sm"
                tooltip="Code Block"
              >
                <Code size={iconSize} />
              </TooltipButton>
            </Col>
            <Col className="px-0">
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onLinkClick}
                type="button"
                size="sm"
                tooltip="Hyperlink"
              >
                <Link size={iconSize} />
              </TooltipButton>
            </Col>
            <Col className="px-0">
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onItalicClick}
                type="button"
                size="sm"
                tooltip={
                  <>
                    Italic<kbd>Ctrl + I</kbd>{" "}
                  </>
                }
              >
                <Italic size={iconSize} />
              </TooltipButton>
            </Col>
            <Col className="px-0">
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onBoldClick}
                type="button"
                size="sm"
                tooltip={
                  <>
                    Bold<kbd>Ctrl + B</kbd>{" "}
                  </>
                }
              >
                <Bold size={iconSize} />
              </TooltipButton>
            </Col>
          </Row>
        )}
      </Nav>
    </div>
  );
};
export default EditorHeader;
