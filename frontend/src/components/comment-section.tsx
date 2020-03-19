import { ListGroup } from "@vseth/components";
import React, { useState } from "react";
import { Answer, AnswerSection } from "../interfaces";
import CommentComponent from "./comment";
import { css } from "emotion";

const showMoreStyle = css`
  text-decoration: underline;
  cursor: pointer;
`;

interface Props {
  hasDraft: boolean;
  section: AnswerSection;
  answer: Answer;
  onSectionChanged: (newSection: AnswerSection) => void;
  onDraftDelete: () => void;
}
const CommentSectionComponent: React.FC<Props> = ({
  hasDraft,
  section,
  answer,
  onSectionChanged,
  onDraftDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <ListGroup style={{ marginTop: "1em" }}>
        {(expanded ? answer.comments : answer.comments.slice(0, 3)).map(
          comment => (
            <CommentComponent
              answer={answer}
              onSectionChanged={onSectionChanged}
              section={section}
              comment={comment}
              key={comment.oid}
            />
          ),
        )}
        {hasDraft && (
          <CommentComponent
            answer={answer}
            onSectionChanged={onSectionChanged}
            section={section}
            comment={undefined}
            onDelete={onDraftDelete}
          />
        )}
      </ListGroup>
      {answer.comments.length > 3 && !expanded && (
        <p onClick={() => setExpanded(true)} className={showMoreStyle}>
          {answer.comments.length === 4 ? (
            "Show 1 more comment..."
          ) : (
            <>Show {answer.comments.length - 3} more comments...</>
          )}
        </p>
      )}
    </>
  );
};
export default CommentSectionComponent;
