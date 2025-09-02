import { Anchor, Box, Breadcrumbs, Button, Card, Divider, Flex, Menu, Paper, Text } from "@mantine/core";
import { differenceInSeconds, formatDistanceToNow } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";
import { SingleComment } from "../interfaces";
import MarkdownText from "./markdown-text";
import { IconChevronRight, IconChevronUp, IconCode, IconDots, IconFlag, IconLink, IconX } from "@tabler/icons-react";
import TimeText from "./time-text";
import classes from "./comment-single.module.css";
import TooltipButton from "./TooltipButton";
import { useUser } from "../auth";
import { useResetExamCommentFlaggedVote, useSetExamCommentFlagged } from "../api/hooks";
import { useDisclosure } from "@mantine/hooks";
import CodeBlock from "./code-block";
import { copy } from "../utils/clipboard";

interface Props {
  comment: SingleComment;
  reload: () => void;
}

const SingleCommentComponent: React.FC<Props> = ({ comment, reload }) => {
  const [viewSource, {toggle: toggleViewSource}] = useDisclosure();
  const [setFlaggedLoading, setExamCommentFlagged] = useSetExamCommentFlagged(reload);
  const [resetFlaggedLoading, resetExamCommentFlagged] = useResetExamCommentFlaggedVote(reload);
  const { isAdmin, username } = useUser()!;

  const flaggedLoading = setFlaggedLoading || resetFlaggedLoading;
  
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
            to={`/exams/${comment.filename}?comment=${comment.longId}&answer=${comment.answerId}`}
            tt="uppercase"
            size="xs"
          >
            Comment
          </Anchor>
        </Breadcrumbs>
        <Flex justify="space-between" align="center">
          <Box my="xs" px="md">
            <Anchor component={Link} to={`/user/${comment.authorId}`}>
              <Text fw={700} component="span">
                {comment.authorDisplayName}
              </Text>
              <Text ml="0.3em" color="dimmed" component="span">
                @{comment.authorId}
              </Text>
              <Text color="dimmed" mx={6} component="span">
                ·
              </Text>
            </Anchor>
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
          </Box>
          {comment &&
          (comment.isFlagged ||
            (comment.flaggedCount > 0 && isAdmin) ||
            flaggedLoading) && (
            <Paper shadow="xs" mr="md">
              <Button.Group>
                <TooltipButton
                  tooltip="Flagged as Inappropriate"
                  color="red"
                  px={12}
                  variant="filled"
                >
                  <IconFlag />
                </TooltipButton>
                <TooltipButton
                  color="red"
                  miw={30}
                  tooltip={`${comment.flaggedCount} users consider this answer inappropriate.`}
                >
                  {comment.flaggedCount}
                </TooltipButton>
                <TooltipButton
                  px={8}
                  tooltip={
                    comment.isFlagged
                      ? "Remove inappropriate flag"
                      : "Add inappropriate flag"
                  }
                  size="sm"
                  loading={flaggedLoading}
                  style={{ borderLeftWidth: 0 }}
                  onClick={() =>
                    setExamCommentFlagged(comment.oid, !comment.isFlagged)
                  }
                >
                  {comment.isFlagged ? <IconX /> : <IconChevronUp />}
                </TooltipButton>
              </Button.Group>
            </Paper>
          )}
          {comment && (
            <Menu withinPortal>
              <Menu.Target>
                <Button size="xs" variant="light" color="black" mr="md"><IconDots/></Button>
              </Menu.Target>
              <Menu.Dropdown>
                {comment.flaggedCount === 0 && (
                  <Menu.Item
                    leftSection={<IconFlag />}
                    onClick={() => setExamCommentFlagged(comment.oid, true)}
                  >
                    Flag as Inappropriate
                  </Menu.Item>
                )}
                <Menu.Item
                        leftSection={<IconLink />}
                        onClick={() =>
                          copy(
                            `${document.location.origin}/exams/${comment.filename}?comment=${comment.longId}&answer=${comment.answerId}`,
                          )
                        }
                      >
                        Copy Permalink
                </Menu.Item>
                {isAdmin && comment.flaggedCount > 0 && (
                  <Menu.Item
                    leftSection={<IconFlag />}
                    onClick={() => resetExamCommentFlagged(comment.oid)}
                  >
                    Remove all inappropriate flags
                  </Menu.Item>
                )}
                <Menu.Item
                  leftSection={<IconCode />}
                  onClick={toggleViewSource}
                >
                  Toggle Source Code Mode
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Flex>
        <Divider />
      </Card.Section>
      <div>
        {viewSource ? (
            <CodeBlock value={comment.text} language="markdown" />
          ) : (
            <MarkdownText value={comment.text} />
          )}
      </div>
    </Card>
  );
};
export default SingleCommentComponent;
