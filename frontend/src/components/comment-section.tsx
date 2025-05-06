import { Button, Group, Stack } from "@mantine/core";
import classes from "./comment-section.module.css";
import { IconMessageCirclePlus } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { Answer, AnswerSection } from "../interfaces";
import CommentComponent from "./comment";
import { useLocation } from "react-router-dom";

interface Props {
  hasDraft: boolean;
  answer: Answer;
  onSectionChanged: (newSection: AnswerSection) => void;
  // Called when the user click on the reply button at the bottom of the comment section.
  // Note: This is not the same as the comment button in the answer itself,
  // although the behaviour may be identical depending on what the callback does.
  onChainReply: () => void;
  onDraftDelete: () => void;
}
const CommentSectionComponent: React.FC<Props> = ({
  hasDraft,
  answer,
  onSectionChanged,
  onChainReply,
  onDraftDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const {search: searchParams} = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const id = params.get("comment");
    if (id && answer.comments.map((item) => item.longId).includes(id)) {
      setExpanded(true);
    }
  }, [searchParams]);
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
      <Group justify="space-between">
        {answer.comments.length > 3 && !expanded && (
          <Button
            variant="transparent"
            c="currentColor"
            pt="xs"
            onClick={() => setExpanded(true)}
          >
            {answer.comments.length === 4 ? (
              "Show 1 more comment..."
            ) : (
              <>Show {answer.comments.length - 3} more comments...</>
            )}
          </Button>
        )}
        {answer.comments.length > 0 && !hasDraft && (
          <Button
            variant="transparent"
            c="currentColor"
            pt="xs"
            leftSection={<IconMessageCirclePlus />}
            onClick={onChainReply}
            className={classes.chainReply}
          >
            Add Comment
          </Button>
        )}
      </Group>
    </>
  );
};
export default CommentSectionComponent;
