import { Container, ListGroup, ListGroupItem } from "@vseth/components";
import React from "react";
import { Answer } from "../interfaces";

interface Props {
  answer: Answer;
}
const CommentSectionComponent: React.FC<Props> = ({ answer }) => {
  return (
    <ListGroup>
      {answer.comments.map(comment => (
        <ListGroupItem>
          <h6>{comment.authorDisplayName}</h6>
          {comment.text}
        </ListGroupItem>
      ))}
    </ListGroup>
  );
};
export default CommentSectionComponent;
