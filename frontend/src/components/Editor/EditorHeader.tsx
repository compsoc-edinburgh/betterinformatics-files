import { css } from "@emotion/css";
import * as React from "react";
import { Bold, Code, DollarSign, Image, Italic, Link, Maximize, Minimize } from "react-feather";
import TooltipButton from "../TooltipButton";
import { EditorMode } from "./utils/types";
import { useCallback, useRef } from "react";
import { Flex, Tabs } from "@mantine/core";

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
const fileInputStyle = css`
  visibility: hidden;
  display: none;
`;

interface Props {
  activeMode: EditorMode;
  onActiveModeChange: (newMode: EditorMode) => void;

  enableFullscreen?: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  onFiles: (files: File[]) => void;
  onMathClick: () => void;
  onCodeClick: () => void;
  onLinkClick: () => void;
  onItalicClick: () => void;
  onBoldClick: () => void;
}
const EditorHeader: React.FC<Props> = ({
  activeMode,
  onActiveModeChange,
  onFiles,
  enableFullscreen,
  isFullscreen,
  ...handlers
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileInput = fileInputRef.current;
      if (fileInput === null) return;
      const fileList = fileInput.files;
      if (fileList === null) return;
      const files: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i);
        if (file === null) continue;
        files.push(file);
      }
      onFiles(files);
      fileInput.value = "";
    },
    [onFiles],
  );

  const iconSize = 15;
  return (
    <div className={headerStyle}>
      <input
        type="file"
        className={fileInputStyle}
        ref={fileInputRef}
        onChange={onChangeHandler}
      />
      <Tabs
        value={activeMode}
        onTabChange={onActiveModeChange}
        className={navStyle}
      >
        <Tabs.List>
          <Tabs.Tab value="write">Write</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
          {isFullscreen && <Tabs.Tab value="split">Split</Tabs.Tab>}
        </Tabs.List>
        <Flex>
          {activeMode !== "preview" && (
            <>
              <TooltipButton
                className={iconButtonStyle}
                onClick={() => fileInputRef.current?.click()}
                type="button"
                size="sm"
                tooltip="Insert Image"
              >
                <Image size={iconSize} />
              </TooltipButton>
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onMathClick}
                type="button"
                size="sm"
                tooltip="Inline Math"
              >
                <DollarSign size={iconSize} />
              </TooltipButton>
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onCodeClick}
                type="button"
                size="sm"
                tooltip="Code Block"
              >
                <Code size={iconSize} />
              </TooltipButton>
              <TooltipButton
                className={iconButtonStyle}
                onClick={handlers.onLinkClick}
                type="button"
                size="sm"
                tooltip="Hyperlink"
              >
                <Link size={iconSize} />
              </TooltipButton>
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
            </>
          )}
          {enableFullscreen && (
            <TooltipButton
              className={iconButtonStyle}
              onClick={handlers.toggleFullscreen}
              type="button"
              size="sm"
              tooltip={
                <>
                  Toggle fullscreen
                </>
              }
            >
              {isFullscreen ? <Minimize size={iconSize} /> : <Maximize size={iconSize} />}
            </TooltipButton>
          )}
        </Flex>
      </Tabs>
    </div>
  );
};
export default EditorHeader;
