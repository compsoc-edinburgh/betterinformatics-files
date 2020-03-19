import { ListGroup } from "@vseth/components";
import React from "react";
import { Answer, AnswerSection } from "../interfaces";
import CommentComponent from "./comment";

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
  return (
    <ListGroup>
      {answer.comments.map(comment => (
        <CommentComponent
          answer={answer}
          onSectionChanged={onSectionChanged}
          section={section}
          comment={comment}
          key={comment.oid}
        />
      ))}
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
  );
};
export default CommentSectionComponent;
