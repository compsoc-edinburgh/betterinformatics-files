import {
  Button,
  Checkbox,
  Grid,
  Slider,
  Pagination,
} from "@mantine/core";
import { useDebounceFn } from "@umijs/hooks";
import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, ICONS } from "vseth-canine-ui";
import { EditMode, EditState, ExamMetaData } from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import serverData from "../utils/server-data";
import IconButton from "./icon-button";
import Panel from "./panel";

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
  visiblePages: Set<number>;

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
  const [widthValue, setWidthValue] = useState(maxWidth);
  const { run: changeWidth } = useDebounceFn(
    (val: number) => setMaxWidth(val),
    500,
  );
  const handler = (val: number) => {
    changeWidth(val);
    setWidthValue(val);
  };
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
  const scrollToTop = useCallback(() => {
    const c = document.documentElement.scrollTop || document.body.scrollTop;
    if (c > 0) {
      window.requestAnimationFrame(scrollToTop);
      window.scrollTo(0, c - c / 10 - 1);
    } else {
      toggle();
    }
  }, [toggle]);

  return (
    <Panel isOpen={isOpen} toggle={toggle}>
      <Link
        className="link-text"
        to={`/category/${metaData ? metaData.category : ""}`}
      >
        {metaData && metaData.category_displayname}
      </Link>
      <p>
        <small>{metaData && metaData.displayname}</small>
      </p>
      <h6 className="my-3 mx-2">Pages</h6>
      {!!renderer && (
        <Pagination total={renderer.document.numPages} getItemProps={(page) => ({
          component: 'a',
          href: `#page-${page}`,
        })} withControls={false} />
      )
      }
      <h6 className="my-3 mx-2">Size</h6>
      <Slider
        min={500}
        max={2000}
        value={widthValue}
        onChange={handler}
      />
      <h6 className="my-3 mx-2">Actions</h6>
      <Button.Group>
        <IconButton
          tooltip="Report problem"
          iconName={ICONS.MESSAGE}
          onClick={reportProblem}
        />
        <IconButton
          tooltip="Back to the top"
          iconName={ICONS.ARROW_UP}
          onClick={scrollToTop}
        />
        {!allSectionsExpanded && (
          <IconButton
            tooltip="Expand all answers"
            iconName={ICONS.ADJUST_UP_DOWN}
            onClick={onExpandAllSections}
          />
        )}
        {!allSectionsCollapsed && (
          <IconButton
            tooltip="Collapse all answers"
            iconName={ICONS.ADJUST_UP_DOWN_ALT}
            onClick={onCollapseAllSections}
          />
        )}
      </Button.Group>

      {
        canEdit && (
          <>
            <h6 className="my-3 mx-2">Edit Mode</h6>
            <Grid>
              {editState.mode !== EditMode.None && (
                <Grid.Col xs="auto">
                  <Button
                    size="sm"
                    onClick={() => setEditState({ mode: EditMode.None })}
                    leftIcon={<Icon icon={ICONS.CLOSE} />}
                  >
                    Stop Editing
                  </Button>
                </Grid.Col>
              )}
              {editState.mode !== EditMode.Add && (
                <Grid.Col xs="auto">
                  <Button
                    size="sm"
                    onClick={() =>
                      setEditState({
                        mode: EditMode.Add,
                        snap,
                      })
                    }
                    leftIcon={<Icon icon={ICONS.PLUS} />}
                  >
                    Add Cuts
                  </Button>
                </Grid.Col>
              )}
            </Grid>
            <div className="my-1">
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
            <h6 className="my-3 mx-2">Display Options</h6>
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
          </>
        )
      }
      All answers are licensed as & nbsp;
      <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
        CC BY-NC-SA 4.0
      </a>
      .
    </Panel >
  );
};
export default ExamPanel;
