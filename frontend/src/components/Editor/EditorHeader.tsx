import * as React from "react";
import TooltipButton from "../TooltipButton";
import { useCallback, useRef } from "react";
import { Button, Flex, Group, Stack, Tabs } from "@mantine/core";
import {
  IconBold,
  IconCode,
  IconItalic,
  IconLink,
  IconMath,
  IconMaximize,
  IconMinimize,
  IconPhoto,
} from "@tabler/icons-react";
import classes from "./EditorHeader.module.css";

interface Props {
  activeMode: string | null;
  onActiveModeChange: (newMode: string | null) => void;

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

  return (
    <div className={classes.header}>
      <input
        type="file"
        className={classes.fileInput}
        ref={fileInputRef}
        onChange={onChangeHandler}
      />
      <Group justify="space-between">
        <Tabs
          value={activeMode}
          onChange={onActiveModeChange}
          className={classes.nav}
        >
          <Tabs.List>
            <Tabs.Tab value="write">Write</Tabs.Tab>
            <Tabs.Tab value="preview">Preview</Tabs.Tab>
            {isFullscreen && <Tabs.Tab value="split">Split</Tabs.Tab>}
          </Tabs.List>
        </Tabs>
        <Flex>
          {activeMode !== "preview" && (
            <Button.Group>
              <TooltipButton
                className={classes.iconButton}
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                tooltip="Insert Image"
              >
                <IconPhoto />
              </TooltipButton>
              <TooltipButton
                className={classes.iconButton}
                onClick={handlers.onMathClick}
                size="sm"
                tooltip="Inline Math"
              >
                <IconMath />
              </TooltipButton>
              <TooltipButton
                className={classes.iconButton}
                onClick={handlers.onCodeClick}
                size="sm"
                tooltip="Code Block"
              >
                <IconCode />
              </TooltipButton>
              <TooltipButton
                className={classes.iconButton}
                onClick={handlers.onLinkClick}
                size="sm"
                tooltip="Hyperlink"
              >
                <IconLink />
              </TooltipButton>
              <TooltipButton
                className={classes.iconButton}
                onClick={handlers.onItalicClick}
                size="sm"
                tooltip={
                  <Stack gap="0.4em">
                    Italic
                    <kbd>Ctrl + I</kbd>
                  </Stack>
                }
              >
                <IconItalic />
              </TooltipButton>
              <TooltipButton
                className={classes.iconButton}
                onClick={handlers.onBoldClick}
                size="sm"
                tooltip={
                  <Stack gap="0.4em">
                    Bold
                    <kbd>Ctrl + B</kbd>
                  </Stack>
                }
              >
                <IconBold />
              </TooltipButton>
            </Button.Group>
          )}
          <TooltipButton
            ml="sm"
            className={classes.iconButton}
            onClick={handlers.toggleFullscreen}
            size="sm"
            tooltip="Toggle fullscreen"
          >
            {isFullscreen ? <IconMinimize /> : <IconMaximize />}
          </TooltipButton>
        </Flex>
      </Group>
    </div>
  );
};
export default EditorHeader;
