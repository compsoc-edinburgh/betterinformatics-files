import { Button, Flex, Paper, Stack } from "@mantine/core";
import classes from "./comment-section.module.css";
import { IconMessageCirclePlus } from "@tabler/icons-react";
import React, { useState } from "react";
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
  const [expandedByUser, setExpandedByUser] = useState(false);
  const {search: searchParams} = useLocation();
  const paramCommentId = new URLSearchParams(searchParams).get("comment");
  const expandedByURL = paramCommentId && answer.comments.map((item) => item.longId).includes(paramCommentId);
  const expanded = expandedByUser || expandedByURL;

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
        {answer.comments.length > 3 && !expanded && (
          <Paper
            radius={0}
            withBorder
            shadow="none"
            px="sm"
            style={{ marginBottom: "-1px" }}
          >
            <Flex justify="center" align="center">
              <Button
                size="compact-sm"
                variant="transparent"
                c="currentColor"
                onClick={() => setExpandedByUser(true)}
              >
                Load {(answer.comments.length - 3).toString()} more comment
                {answer.comments.length > 4 && "s"}
              </Button>
            </Flex>
          </Paper>
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
      {answer.comments.length > 0 && !hasDraft && (
        <Button
          size="compact-sm"
          variant="transparent"
          c="currentColor"
          mt="xs"
          leftSection={<IconMessageCirclePlus />}
          onClick={onChainReply}
          className={classes.chainReply}
        >
          Add Comment
        </Button>
      )}
    </>
  );
};
export default CommentSectionComponent;
