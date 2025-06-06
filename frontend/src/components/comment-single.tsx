import { Anchor, Breadcrumbs, Card, Divider, Group, Text } from "@mantine/core";
import { differenceInSeconds } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";
import { SingleComment } from "../interfaces";
import MarkdownText from "./markdown-text";
import TimeText from "./time-text";
import { IconChevronRight } from "@tabler/icons-react";
import classes from "./comment-single.module.css";
import displayNameClasses from "../utils/display-name.module.css";

interface Props {
  comment: SingleComment;
}

const SingleCommentComponent: React.FC<Props> = ({ comment }) => {
  return (
    <Card withBorder shadow="md" mb="md">
      <Card.Section mb="md">
        <Breadcrumbs
          px="md"
          pt="md"
          separator={<IconChevronRight />}
          className={classes.noMargin}
        >
          <Anchor
            component={Link}
            to={`/category/${comment.category_slug}`}
            tt="uppercase"
            size="xs"
            style={{ wordBreak: "break-word", textWrap: "pretty" }}
          >
            {comment.category_displayname}
          </Anchor>
          <Anchor
            component={Link}
            to={`/exams/${comment.filename}`}
            tt="uppercase"
            size="xs"
            style={{ wordBreak: "break-word", textWrap: "pretty" }}
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
        <Group my="xs" px="md" gap={0}>
          <Anchor
            component={Link}
            to={`/user/${comment.authorId}`}
            className={displayNameClasses.shrinkableDisplayName}
          >
            <Text fw={700} component="span">
              {comment.authorDisplayName}
            </Text>
            <Text ml="0.3em" color="dimmed" component="span">
              @{comment.authorId}
            </Text>
          </Anchor>
          <Text color="dimmed" mx={6} component="span">
            ·
          </Text>
          {comment && (
            <TimeText time={comment.time} suffix="ago" />
          )}
          {comment &&
            differenceInSeconds(
              new Date(comment.edittime),
              new Date(comment.time),
            ) > 1 && (
              <>
                <Text color="dimmed" mx={6} component="span">
                  ·
                </Text>
                <TimeText time={comment.edittime} prefix="edited" suffix="ago" />
              </>
            )}
        </Group>
        <Divider />
      </Card.Section>
      <MarkdownText value={comment.text} />
    </Card>
  );
};

export default SingleCommentComponent;
