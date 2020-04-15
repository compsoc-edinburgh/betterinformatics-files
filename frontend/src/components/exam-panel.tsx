import { useDebounceFn } from "@umijs/hooks";
import {
  ButtonGroup,
  Input,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
  FormGroup,
  Label,
} from "@vseth/components";
import { css } from "emotion";
import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../auth";
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
  const user = useUser()!;
  const isCatAdmin = user.isCategoryAdmin;
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
        <h6>Pages</h6>
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

        <h6>Size</h6>
        <Input
          type="range"
          min="500"
          max="2000"
          value={widthValue}
          onChange={handler}
        />
        <h6>Actions</h6>
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

        {isCatAdmin && (
          <>
            <h6>Edit Mode</h6>
            <ButtonGroup vertical>
              <IconButton
                tooltip="Disable editing"
                onClick={() => setEditState({ mode: EditMode.None })}
                icon="CLOSE"
                active={editState.mode === EditMode.None}
              >
                Readonly
              </IconButton>
              <IconButton
                tooltip="Add new cuts"
                onClick={() =>
                  setEditState({
                    mode: EditMode.Add,
                    snap,
                  })
                }
                icon="PLUS"
                active={editState.mode === EditMode.Add}
              >
                Add Cuts
              </IconButton>
              <IconButton
                tooltip="The highlighted cut including its answers will be moved to the new location"
                icon="CONNECTION_OBJECT_BOTTOM"
                active={editState.mode === EditMode.Move}
                disabled={editState.mode !== EditMode.Move}
              >
                Move Cut
              </IconButton>
              <IconButton
                tooltip="Toggle snapping behavior"
                icon="TARGET"
                onClick={() =>
                  (editState.mode === EditMode.Add ||
                    editState.mode === EditMode.Move) &&
                  setEditState({ ...editState, snap: !snap })
                }
                active={snap}
                disabled={
                  editState.mode !== EditMode.Add &&
                  editState.mode !== EditMode.Move
                }
              >
                Snap
              </IconButton>
            </ButtonGroup>
            <h6>Display Options</h6>
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
          </>
        )}
      </ModalBody>
      <ModalFooter>All answers are licensed as CC BY-NC-SA 4.0.</ModalFooter>
    </Panel>
  );
};
export default ExamPanel;
