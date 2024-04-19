import {
  Button,
  Checkbox,
  Grid,
  Stack,
  Text,
  Title,
  Anchor,
} from "@mantine/core";
import React, { useCallback } from "react";
import { EditMode, EditState, ExamMetaData } from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import serverData from "../utils/server-data";
import IconButton from "./icon-button";
import PdfPanelBase from "./pdf-panel-base";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconMessageBolt,
  IconPlus,
  IconX,
} from "@tabler/icons-react";

export interface DisplayOptions {
  displayHiddenPdfSections: boolean;
  displayHiddenAnswerSections: boolean;
  displayHideShowButtons: boolean;
  displayEmptyCutLabels: boolean;
}

interface ExamPanelProps {
  isOpen: boolean;
  toggle: () => void;
  metaData: ExamMetaData;
  renderer?: PDF;
  inViewPages?: Set<number>;
  visiblePages?: Set<number>;

  allSectionsExpanded: boolean;
  allSectionsCollapsed: boolean;
  onExpandAllSections: () => void;
  onCollapseAllSections: () => void;

  maxWidth: number;
  setMaxWidth: (newWidth: number) => void;

  editState: EditState;
  setEditState: (newState: EditState) => void;

  displayOptions: DisplayOptions;
  setDisplayOptions: (newOptions: DisplayOptions) => void;
}

const ExamPanel: React.FC<ExamPanelProps> = ({
  isOpen,
  toggle,
  metaData,
  renderer,
  inViewPages,
  visiblePages,

  allSectionsExpanded,
  allSectionsCollapsed,
  onExpandAllSections,
  onCollapseAllSections,

  maxWidth,
  setMaxWidth,

  editState,
  setEditState,

  displayOptions,
  setDisplayOptions,
}) => {
  const canEdit = metaData.canEdit;
  const snap =
    editState.mode === EditMode.Add || editState.mode === EditMode.Move
      ? editState.snap
      : true;
  const reportProblem = useCallback(() => {
    const subject = encodeURIComponent("Community Solutions: Feedback");
    const body = encodeURIComponent(
      `Concerning the exam '${metaData.displayname}' of the course '${metaData.category_displayname}' ...`,
    );
    window.location.href = `mailto:${serverData.email_address}?subject=${subject}&body=${body}`;
  }, [metaData]);
  const setOption = <T extends keyof DisplayOptions>(
    name: T,
    value: DisplayOptions[T],
  ) => setDisplayOptions({ ...displayOptions, [name]: value });

  return (
    <PdfPanelBase
      isOpen={isOpen}
      toggle={toggle}
      renderer={renderer}
      title={metaData.displayname}
      subtitle={metaData.category_displayname}
      inViewPages={inViewPages}
      visiblePages={visiblePages}
      maxWidth={maxWidth}
      setMaxWidth={setMaxWidth}
      additionalActions={[
        <IconButton
          tooltip="Report problem"
          icon={<IconMessageBolt />}
          onClick={reportProblem}
        />,
        !allSectionsExpanded && (
          <IconButton
            tooltip="Expand all answers"
            icon={<IconArrowsMaximize />}
            onClick={onExpandAllSections}
          />
        ),
        !allSectionsCollapsed && (
          <IconButton
            tooltip="Collapse all answers"
            icon={<IconArrowsMinimize />}
            onClick={onCollapseAllSections}
          />
        ),
      ]}
    >
      {canEdit && (
        <>
          <Title order={6}>Edit Mode</Title>
          <Grid>
            {editState.mode !== EditMode.None && (
              <Grid.Col span={{ xs: "auto" }}>
                <Button
                  size="sm"
                  onClick={() => setEditState({ mode: EditMode.None })}
                  leftSection={<IconX />}
                >
                  Stop Editing
                </Button>
              </Grid.Col>
            )}
            {editState.mode !== EditMode.Add && (
              <Grid.Col span={{ xs: "auto" }}>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditState({
                      mode: EditMode.Add,
                      snap,
                    })
                  }
                  leftSection={<IconPlus />}
                >
                  Add Cuts
                </Button>
              </Grid.Col>
            )}
          </Grid>
          <div>
            {editState.mode !== EditMode.None && (
              <Checkbox
                name="check"
                label="Snap"
                checked={editState.snap}
                onChange={e =>
                  setEditState({ ...editState, snap: e.target.checked })
                }
              />
            )}
          </div>
          <Title order={6}>Display Options</Title>
          <Stack gap="xs">
            <Checkbox
              name="check"
              label="Display hidden PDF sections"
              checked={displayOptions.displayHiddenPdfSections}
              onChange={e =>
                setOption("displayHiddenPdfSections", e.target.checked)
              }
            />
            <Checkbox
              name="check"
              label="Display hidden answer sections"
              checked={displayOptions.displayHiddenAnswerSections}
              onChange={e =>
                setOption("displayHiddenAnswerSections", e.target.checked)
              }
            />
            <Checkbox
              name="check"
              label="Display Hide / Show buttons"
              checked={displayOptions.displayHideShowButtons}
              onChange={e =>
                setOption("displayHideShowButtons", e.target.checked)
              }
            />
            <Checkbox
              name="check"
              label="Display empty cut labels"
              checked={displayOptions.displayEmptyCutLabels}
              onChange={e =>
                setOption("displayEmptyCutLabels", e.target.checked)
              }
            />
          </Stack>
        </>
      )}
      <Text size="sm" c="dimmed">
        All answers are licensed as&nbsp;
        <Anchor
          c="blue"
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          target="_blank"
        >
          CC BY-NC-SA 4.0
        </Anchor>
      </Text>
    </PdfPanelBase>
  );
};
export default ExamPanel;
