import Panel from "./panel";
import {
  ModalHeader,
  ModalBody,
  Pagination,
  PaginationItem,
  PaginationLink,
  ButtonGroup,
  ModalFooter,
} from "@vseth/components";
import { Link } from "react-router-dom";
import IconButton from "./icon-button";
import React from "react";
import { ExamMetaData, EditMode, EditState } from "../interfaces";
import PDF from "../pdf-renderer";
import { css } from "emotion";
import { useUser } from "../auth";

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

interface ExamPanelProps {
  isOpen: boolean;
  toggle: () => void;
  metaData: ExamMetaData;
  renderer?: PDF;
  visiblePages: Set<number>;

  editState: EditState;
  setEditState: (newState: EditState) => void;
}

const ExamPanel: React.FC<ExamPanelProps> = ({
  isOpen,
  toggle,
  metaData,
  renderer,
  visiblePages,

  editState,
  setEditState,
}) => {
  const user = useUser()!;
  const isCatAdmin = user.isCategoryAdmin;
  const snap =
    editState.mode === EditMode.Add || editState.mode === EditMode.Move
      ? editState.snap
      : true;
  return (
    <Panel isOpen={isOpen} toggle={toggle}>
      <ModalHeader>
        <Link
          className="link-text"
          to={`/category/${metaData ? metaData.category : ""}`}
        >
          {metaData && metaData.category_displayname}
        </Link>{" "}
        <small>{metaData && metaData.displayname}</small>
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
        <h6>Actions</h6>
        <ButtonGroup>
          <IconButton icon="DOWNLOAD" title="Download PDF" />
          <IconButton icon="LOCK_ALT_OPEN" title="Show All" />
          <IconButton icon="MESSAGE" title="Report Problem" />
          <IconButton icon="ARROW_UP" title="Back to the top" />
        </ButtonGroup>

        {isCatAdmin && (
          <>
            <h6>Edit Mode</h6>
            <ButtonGroup vertical>
              <IconButton
                onClick={() => setEditState({ mode: EditMode.None })}
                icon="CLOSE"
                active={editState.mode === EditMode.None}
              >
                Readonly
              </IconButton>
              <IconButton
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
                icon="CONNECTION_OBJECT_BOTTOM"
                active={editState.mode === EditMode.Move}
                disabled={editState.mode !== EditMode.Move}
              >
                Move Cut
              </IconButton>
              <IconButton
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
          </>
        )}
      </ModalBody>
      <ModalFooter>All answers are licensed as CC BY-NC-SA 4.0.</ModalFooter>
    </Panel>
  );
};
export default ExamPanel;
