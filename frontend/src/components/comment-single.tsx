import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Menu,
  Text,
} from "@mantine/core";
import { differenceInSeconds } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";
import { SingleComment } from "../interfaces";
import MarkdownText from "./markdown-text";
import {
  IconChevronRight,
  IconCode,
  IconDots,
  IconFlag,
  IconRobot,
  IconRobotOff,
} from "@tabler/icons-react";
import TimeText from "./time-text";
import classes from "./comment-single.module.css";
import displayNameClasses from "../utils/display-name.module.css";
import { useUser } from "../auth";
import {
  useResetExamCommentFlaggedVote,
  useResetExamCommentMarkedAsAi,
  useSetExamCommentFlagged,
  useSetExamCommentMarkedAsAi,
} from "../api/hooks";
import { useDisclosure } from "@mantine/hooks";
import CodeBlock from "./code-block";
import { copy } from "../utils/clipboard";
import FlaggedBadge from "./FlaggedBadge";
import MarkedAsAiBadge from "./MarkedAsAiBadge";

interface Props {
  comment: SingleComment;
  reload: () => void;
}

const SingleCommentComponent: React.FC<Props> = ({ comment, reload }) => {
  const [viewSource, { toggle: toggleViewSource }] = useDisclosure();
  const [setFlaggedLoading, setExamCommentFlagged] =
    useSetExamCommentFlagged(reload);
  const [resetFlaggedLoading, resetExamCommentFlagged] =
    useResetExamCommentFlaggedVote(reload);
  const [, setExamCommentMarkedAsAi] = useSetExamCommentMarkedAsAi(reload);
  const [, resetExamCommentMarkedAsAi] = useResetExamCommentMarkedAsAi(reload);
  const { isAdmin } = useUser()!;

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
            to={`/exams/${comment.filename}?comment=${comment.longId}&answer=${comment.answerId}`}
            tt="uppercase"
            size="xs"
          >
            Comment
          </Anchor>
        </Breadcrumbs>
        <Flex justify="space-between" align="center">
          <Box my="xs" px="md">
            <Group gap={0}>
              <Anchor
                component={Link}
                to={`/user/${comment.authorId}`}
                className={displayNameClasses.shrinkableDisplayName}
              >
                <Text fw={700} component="span">
                  {comment.authorDisplayName}
                </Text>
                <Text ml="0.3em" c="dimmed" component="span">
                  @{comment.authorId}
                </Text>
                <Text c="dimmed" mx={6} component="span">
                  ·
                </Text>
              </Anchor>
              {comment && <TimeText time={comment.time} suffix="ago" />}
              {comment &&
                differenceInSeconds(
                  new Date(comment.edittime),
                  new Date(comment.time),
                ) > 1 && (
                  <>
                    <Text c="dimmed" mx={6} component="span">
                      ·
                    </Text>
                    <TimeText
                      time={comment.edittime}
                      prefix="edited"
                      suffix="ago"
                    />
                  </>
                )}
            </Group>
            <MarkedAsAiBadge count={comment.markedAsAiCount} />
          </Box>
          <Flex align="center">
            {comment && (
              <FlaggedBadge
                count={comment.flaggedCount}
                isFlagged={comment.isFlagged}
                loading={flaggedLoading}
                onToggle={() =>
                  setExamCommentFlagged(comment.oid, !comment.isFlagged)
                }
              />
            )}
            {comment && (
              <Menu withinPortal>
                <Menu.Target>
                  <Button size="xs" variant="light" color="gray" mr="md">
                    <IconDots />
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {!comment.isMarkedAsAi ? (
                    <Menu.Item
                      leftSection={<IconRobot />}
                      onClick={() =>
                        setExamCommentMarkedAsAi(comment.oid, true)
                      }
                    >
                      Mark as AI-generated
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      leftSection={<IconRobotOff />}
                      onClick={() =>
                        setExamCommentMarkedAsAi(comment.oid, false)
                      }
                    >
                      Remove AI-generated mark
                    </Menu.Item>
                  )}
                  {comment.flaggedCount === 0 && (
                    <Menu.Item
                      leftSection={<IconFlag />}
                      onClick={() => setExamCommentFlagged(comment.oid, true)}
                    >
                      Flag as Inappropriate
                    </Menu.Item>
                  )}
                  <Menu.Item
                    onClick={() =>
                      copy(
                        `${document.location.origin}/exams/${comment.filename}?comment=${comment.longId}&answer=${comment.answerId}`,
                      )
                    }
                  >
                    Copy Permalink
                  </Menu.Item>
                  {isAdmin && comment.markedAsAiCount > 0 && (
                    <Menu.Item
                      leftSection={<IconRobotOff />}
                      onClick={() => resetExamCommentMarkedAsAi(comment.oid)}
                    >
                      Remove all AI-generated marks
                    </Menu.Item>
                  )}
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
