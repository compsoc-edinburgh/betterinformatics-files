import { Stack, Text } from "@mantine/core";
import classes from "./comment-section.module.css";
import React, { useState } from "react";
import { Answer, AnswerSection } from "../interfaces";
import CommentComponent from "./comment";

interface Props {
  hasDraft: boolean;
  answer: Answer;
  onSectionChanged: (newSection: AnswerSection) => void;
  onDraftDelete: () => void;
}
const CommentSectionComponent: React.FC<Props> = ({
  hasDraft,
  answer,
  onSectionChanged,
  onDraftDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <Stack gap="0" className={classes.listGroup}>
        {(expanded ? answer.comments : answer.comments.slice(0, 3)).map(
          comment => (
            <CommentComponent
              answer={answer}
              onSectionChanged={onSectionChanged}
              comment={comment}
              key={comment.oid}
            />
          ),
        )}
        {hasDraft && (
          <CommentComponent
            answer={answer}
            onSectionChanged={onSectionChanged}
            comment={undefined}
            onDelete={onDraftDelete}
          />
        )}
      </Stack>
      {answer.comments.length > 3 && !expanded && (
        <Text
          pt="xs"
          onClick={() => setExpanded(true)}
          className={classes.showMore}
        >
          {answer.comments.length === 4 ? (
            "Show 1 more comment..."
          ) : (
            <>Show {answer.comments.length - 3} more comments...</>
          )}
        </Text>
      )}
    </>
  );
};
export default CommentSectionComponent;
