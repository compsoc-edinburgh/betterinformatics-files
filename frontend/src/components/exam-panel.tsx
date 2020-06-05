import { useDebounceFn } from "@umijs/hooks";
import {
  ButtonGroup,
  Col,
  FormGroup,
  Input,
  Label,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
} from "@vseth/components";
import { css } from "emotion";
import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { EditMode, EditState, ExamMetaData } from "../interfaces";
import PDF from "../pdf/pdf-renderer";
import IconButton from "./icon-button";
import Panel from "./panel";

const intMap = <T,>(from: number, to: number, cb: (num: number) => T) => {
  const acc: T[] = [];
  for (let i = from; i <= to; i++) {
    acc.push(cb(i));
  }
  return acc;
};
const paginationStyle = css`
  & .pagination {
    display: inline-block;
  }
  & .pagination .page-item {
    display: inline-block;
  }
`;

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
  const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.currentTarget.value);
    changeWidth(val);
    setWidthValue(val);
  };
  const download = useCallback(() => {
    window.open(`/api/exam/pdf/exam/${metaData.filename}/?download`, "_blank");
  }, [metaData.filename]);
  const reportProblem = useCallback(() => {
    const subject = encodeURIComponent("[VIS] Community Solutions: Feedback");
    const body = encodeURIComponent(
      `Concerning the exam '${metaData.displayname}' of the course '${metaData.category_displayname}' ...`,
    );
    window.location.href = `mailto:communitysolutions@vis.ethz.ch?subject=${subject}&body=${body}`;
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
    }
  }, []);

  return (
    <Panel isOpen={isOpen} toggle={toggle}>
      <ModalHeader>
        <Link
          className="link-text"
          to={`/category/${metaData ? metaData.category : ""}`}
        >
          {metaData && metaData.category_displayname}
        </Link>
        <p>
          <small>{metaData && metaData.displayname}</small>
        </p>
      </ModalHeader>
      <ModalBody>
        <h6 className="my-3 mx-2">Pages</h6>
        <Pagination className={paginationStyle}>
          {renderer &&
            intMap(1, renderer.document.numPages, pageNum => (
              <PaginationItem active key={pageNum}>
                {visiblePages.has(pageNum) ? (
                  <PaginationLink href={`#page-${pageNum}`} className="border">
                    {pageNum}
                  </PaginationLink>
                ) : (
                  <PaginationLink href={`#page-${pageNum}`}>
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
        </Pagination>

        <h6 className="my-3 mx-2">Size</h6>
        <Input
          type="range"
          min="500"
          max="2000"
          value={widthValue}
          onChange={handler}
        />
        <h6 className="my-3 mx-2">Actions</h6>
        <ButtonGroup>
          <IconButton
            tooltip="Download this exam as a PDF file"
            icon="DOWNLOAD"
            onClick={download}
          />
          <IconButton
            tooltip="Report problem"
            icon="MESSAGE"
            onClick={reportProblem}
          />
          <IconButton
            tooltip="Back to the top"
            icon="ARROW_UP"
            onClick={scrollToTop}
          />
        </ButtonGroup>

        {canEdit && (
          <>
            <h6 className="my-3 mx-2">Edit Mode</h6>
            <Row form>
              {editState.mode !== EditMode.None && (
                <Col xs="auto">
                  <IconButton
                    size="sm"
                    tooltip="Disable editing"
                    onClick={() => setEditState({ mode: EditMode.None })}
                    icon="CLOSE"
                  >
                    Stop Editing
                  </IconButton>
                </Col>
              )}
              {editState.mode !== EditMode.Add && (
                <Col xs="auto">
                  <IconButton
                    size="sm"
                    tooltip="Add new cuts"
                    onClick={() =>
                      setEditState({
                        mode: EditMode.Add,
                        snap,
                      })
                    }
                    icon="PLUS"
                  >
                    Add Cuts
                  </IconButton>
                </Col>
              )}
            </Row>
            <div className="my-1">
              {editState.mode !== EditMode.None && (
                <FormGroup check>
                  <Input
                    type="checkbox"
                    name="check"
                    id="snap"
                    checked={editState.snap}
                    onChange={e =>
                      setEditState({ ...editState, snap: e.target.checked })
                    }
                  />
                  <Label for="snap" check>
                    Snap
                  </Label>
                </FormGroup>
              )}
            </div>
            <h6 className="my-3 mx-2">Display Options</h6>
            <FormGroup check>
              <Input
                type="checkbox"
                name="check"
                id="displayHiddenPdfSections"
                checked={displayOptions.displayHiddenPdfSections}
                onChange={e =>
                  setOption("displayHiddenPdfSections", e.target.checked)
                }
              />
              <Label for="displayHiddenPdfSections" check>
                Display hidden PDF sections
              </Label>
            </FormGroup>
            <FormGroup check>
              <Input
                type="checkbox"
                name="check"
                id="displayHiddenAnswerSections"
                checked={displayOptions.displayHiddenAnswerSections}
                onChange={e =>
                  setOption("displayHiddenAnswerSections", e.target.checked)
                }
              />
              <Label for="displayHiddenAnswerSections" check>
                Display hidden answer sections
              </Label>
            </FormGroup>
            <FormGroup check>
              <Input
                type="checkbox"
                name="check"
                id="displayHideShowButtons"
                checked={displayOptions.displayHideShowButtons}
                onChange={e =>
                  setOption("displayHideShowButtons", e.target.checked)
                }
              />
              <Label for="displayHideShowButtons" check>
                Display Hide / Show buttons
              </Label>
            </FormGroup>
            <FormGroup check>
              <Input
                type="checkbox"
                name="check"
                id="displayEmptyCutLabels"
                checked={displayOptions.displayEmptyCutLabels}
                onChange={e =>
                  setOption("displayEmptyCutLabels", e.target.checked)
                }
              />
              <Label for="displayEmptyCutLabels" check>
                Display empty cut labels
              </Label>
            </FormGroup>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        All answers are licensed as &nbsp;
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
          CC BY-NC-SA 4.0
        </a>
        .
      </ModalFooter>
    </Panel>
  );
};
export default ExamPanel;
