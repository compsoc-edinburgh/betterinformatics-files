import { Anchor, Box, Breadcrumbs, Card, Divider, Text } from "@mantine/core";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";
import { SingleComment } from "../interfaces";
import MarkdownText from "./markdown-text";
import { css } from "@emotion/css";
import { Icon, ICONS } from "vseth-canine-ui";

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
    <Card withBorder shadow="md" mb="md">
      <Card.Section bg="gray.0">
        <Breadcrumbs
          px="md"
          pt="md"
          separator={<Icon icon={ICONS.RIGHT} size={10} />}
          className={noMarginBreadcrumb}
        >
          <Anchor
            component={Link}
            to={`/category/${comment.category_slug}`}
            tt="uppercase"
            size="xs"
          >
            {comment.category_displayname}
          </Anchor>
          <Anchor
            component={Link}
            to={`/exams/${comment.filename}`}
            tt="uppercase"
            size="xs"
          >
            {comment.exam_displayname}
          </Anchor>
          <Anchor
            component={Link}
            to={`/exams/${comment.filename}#${comment.answerId}`}
            tt="uppercase"
            size="xs"
          >
            Comment
          </Anchor>
        </Breadcrumbs>
        <Box my="xs" px="md">
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
                <span>·</span>
                <span title={comment.edittime}>
                  edited {formatDistanceToNow(new Date(comment.edittime))} ago
                </span>
              </>
            )}
        </Box>
        <Divider mb="md" />
      </Card.Section>
      <MarkdownText value={comment.text} />
    </Card>
  );
};

export default SingleCommentComponent;
