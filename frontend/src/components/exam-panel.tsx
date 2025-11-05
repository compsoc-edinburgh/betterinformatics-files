import {
  Button,
  Checkbox,
  Grid,
  Stack,
  Text,
  Title,
  Anchor,
  Group,
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
import ClaimButton from "./claim-button";
import { useRequest } from "@umijs/hooks";
import { useUser } from "../auth";
import { hasValidClaim } from "../utils/exam-utils";
import { loadExamAdminStatus } from "../api/hooks";

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
  const user = useUser();

  const {
    error: examError,
    data: exam,
    run: reloadExam,
  } = useRequest(() =>
    user?.isAdmin
      ? loadExamAdminStatus(metaData.filename)
      : Promise.resolve(undefined),
  );

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
          key="report-problem"
          tooltip="Report problem"
          icon={<IconMessageBolt />}
          onClick={reportProblem}
        />,
        !allSectionsExpanded && (
          <IconButton
            key="expand-all"
            tooltip="Expand all answers"
            icon={<IconArrowsMaximize />}
            onClick={onExpandAllSections}
          />
        ),
        !allSectionsCollapsed && (
          <IconButton
            key="collapse-all"
            tooltip="Collapse all answers"
            icon={<IconArrowsMinimize />}
            onClick={onCollapseAllSections}
          />
        ),
      ]}
    >
      {canEdit && (
        <>
          {examError && (
            <Text>Could not load admin info: {examError.message}</Text>
          )}
          {exam && (
            <>
              <Title order={6}>Edit Mode</Title>
              <Group>
                {hasValidClaim(exam) &&
                  exam.import_claim === user?.username && (
                    <>
                      {editState.mode !== EditMode.Add && (
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
                      )}
                      {editState.mode !== EditMode.None && (
                        <Button
                          size="sm"
                          onClick={() => setEditState({ mode: EditMode.None })}
                          leftSection={<IconX />}
                        >
                          Stop Editing
                        </Button>
                      )}
                    </>
                  )}
                <ClaimButton exam={exam} reloadExams={reloadExam} />
              </Group>
            </>
          )}
          {exam &&
            hasValidClaim(exam) &&
            exam.import_claim === user?.username &&
            editState.mode !== EditMode.None && (
              <div>
                <Checkbox
                  name="check"
                  label="Snap"
                  checked={editState.snap}
                  onChange={e =>
                    setEditState({ ...editState, snap: e.target.checked })
                  }
                />
              </div>
            )}
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
