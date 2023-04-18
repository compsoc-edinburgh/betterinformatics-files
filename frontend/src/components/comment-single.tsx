import { Anchor, Box, Breadcrumbs, Card, Divider, Text } from "@mantine/core";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";
import { SingleComment } from "../interfaces";
import MarkdownText from "./markdown-text";
import { css } from "@emotion/css";

interface Props {
  comment: SingleComment;
}

const noMarginBreadcrumb = css`
  & .breadcrumb {
    margin: 0;
  }
`;

const SingleCommentComponent: React.FC<Props> = ({ comment }) => {
  return (
    <Card withBorder shadow="sm" m="md">
      <Breadcrumbs separator="›" className={noMarginBreadcrumb}>
        <Anchor
          component={Link}
          to={`/category/${comment.category_slug}`}
          className="text-primary"
          tt="uppercase"
          size="xs"
        >
          {comment.category_displayname}
        </Anchor>
        <Anchor
          component={Link}
          to={`/exams/${comment.filename}`}
          className="text-primary"
          tt="uppercase"
          size="xs"
        >
          {comment.exam_displayname}
        </Anchor>
        <Anchor
          component={Link}
          to={`/exams/${comment.filename}#${comment.answerId}`}
          className="text-primary"
          tt="uppercase"
          size="xs"
        >
          Comment
        </Anchor>
      </Breadcrumbs>
      <Box my="xs">
        <Anchor component={Link} to={`/user/${comment.authorId}`}>
          <Text weight={700} component="span">
            {comment.authorDisplayName}
          </Text>
          <Text ml="0.3em" color="dimmed" component="span">
            @{comment.authorId}
          </Text>
        </Anchor>
        <Text color="dimmed" mx="xs" component="span">
          ·
        </Text>
        {comment && (
          <Text color="dimmed" component="span" title={comment.time}>
            {formatDistanceToNow(new Date(comment.time))} ago
          </Text>
        )}
        {comment &&
          differenceInSeconds(
            new Date(comment.edittime),
            new Date(comment.time),
          ) > 1 && (
            <>
              <span className="text-muted mx-1">·</span>
              <span className="text-muted" title={comment.edittime}>
                edited {formatDistanceToNow(new Date(comment.edittime))} ago
              </span>
            </>
          )}
      </Box>
      <Card.Section>
        <Divider mb="md" />
      </Card.Section>
      <MarkdownText value={comment.text} />
    </Card>
  );
};

export default SingleCommentComponent;
