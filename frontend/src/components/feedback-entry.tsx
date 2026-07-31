import {
  Box,
  Button,
  Card,
  Flex,
  Group,
  Loader,
  Menu,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import * as React from "react";
import { lazy, useState, Suspense } from "react";
import GlobalConsts from "../globalconsts";
import displayNameClasses from "../utils/display-name.module.css";
import TooltipButton from "./TooltipButton";
import {
  IconCheckbox,
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconMail,
  IconMailOpened,
  IconMessageCirclePlus,
  IconPencilCancel,
  IconSquare,
  IconTrash,
} from "@tabler/icons-react";
import { lightFormat, parseISO } from "date-fns";
import { UndoStack } from "./Editor/utils/undo-stack";
import MarkdownText from "./markdown-text";
import { useOfficialSolutionLanguage } from "./official-solution";
import TimeText from "./time-text";
import {
  useCreateFeedbackReply,
  useSetFeedbackFlags,
} from "../api/hooks/feedback";
import type { FeedbackOut } from "../api/model";
import { imageHandler } from "../api/image-utils";

const Editor = lazy(() => import("./Editor"));

interface Props {
  entry: FeedbackOut;
  entryChanged: () => void;
}

const FeedbackEntryComponent: React.FC<Props> = ({ entry, entryChanged }) => {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [undoStack, setUndoStack] = useState<UndoStack>({ prev: [], next: [] });
  const languages = useOfficialSolutionLanguage();

  const { mutate: mutateReplyFeedback, isPending: isPendingReply } =
    useCreateFeedbackReply({
      mutation: {
        onSuccess() {
          setEditing(false);
          entryChanged();
        },
      },
    });
  const { mutate: mutateFlagFeedback } = useSetFeedbackFlags({
    mutation: {
      onSuccess() {
        entryChanged();
      },
    },
  });

  function handleSubmit(reply: string) {
    mutateReplyFeedback({
      data: {
        reply,
      },
      feedbackid: entry.oid,
    });
  }

  function setFlag(flag: "done" | "read", value: boolean) {
    mutateFlagFeedback({
      data: {
        [flag]: value,
      },
      feedbackid: entry.oid,
    });
  }

  const startEditing = () => {
    setDraftText(entry.reply ?? "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraftText("");
  };

  return (
    <Card my="xs" withBorder shadow="md">
      <Card.Section withBorder inheritPadding>
        <Group py="md" justify="space-between">
          <Title order={4} className={displayNameClasses.shrinkableDisplayName}>
            {entry.authorDisplayName} •{" "}
            {lightFormat(
              parseISO(entry.time),
              GlobalConsts.dateFNSFormatString,
            )}
          </Title>
          <Button.Group>
            <TooltipButton
              variant={entry.done ? "default" : "filled"}
              tooltip={`Mark as ${entry.done ? "Not Done" : "Done"}`}
              onClick={() => setFlag("done", !entry.done)}
            >
              {entry.done ? <IconCheckbox /> : <IconSquare />}
            </TooltipButton>
            <TooltipButton
              variant={entry.read ? "default" : "filled"}
              tooltip={`Mark as ${entry.read ? "Unread" : "Read"}`}
              onClick={() => setFlag("read", !entry.read)}
            >
              {entry.read ? <IconMail /> : <IconMailOpened />}
            </TooltipButton>
          </Button.Group>
        </Group>
      </Card.Section>
      <Box pt="xs">
        <MarkdownText value={entry.text} />
      </Box>
      {editing ? (
        <Paper radius="sm" withBorder shadow="none" p="sm" mt="sm">
          <Suspense fallback={<Loader />}>
            <Editor
              value={draftText}
              onChange={setDraftText}
              imageHandler={imageHandler}
              preview={value => (
                <MarkdownText value={value} languages={languages} />
              )}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
            />
            <Group justify="flex-end" mt="sm">
              <Button
                size="sm"
                color="red"
                variant="subtle"
                onClick={cancelEditing}
                leftSection={<IconPencilCancel />}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={isPendingReply}
                disabled={draftText.trim().length === 0}
                onClick={() => handleSubmit(draftText.trim())}
                leftSection={<IconDeviceFloppy />}
              >
                Save
              </Button>
            </Group>
          </Suspense>
        </Paper>
      ) : entry.reply ? (
        <Paper radius="sm" withBorder shadow="none" p="sm" mt="sm">
          <Flex justify="space-between" align="center" mb="xs">
            <div>
              <Text fw={700} component="span">
                Admin
              </Text>
              {entry.reply_time && (
                <>
                  <Text component="span" mx={6} c="dimmed">
                    ·
                  </Text>
                  <TimeText time={entry.reply_time} suffix="ago" />
                </>
              )}
            </div>
            <Menu withinPortal>
              <Menu.Target>
                <Button size="xs" variant="light" color="gray">
                  <IconDots />
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconEdit />} onClick={startEditing}>
                  Edit
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash />}
                  color="red"
                  onClick={() => handleSubmit("")}
                >
                  Clear Reply
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Flex>
          <MarkdownText value={entry.reply} languages={languages} />
        </Paper>
      ) : (
        <Button
          size="compact-sm"
          variant="transparent"
          c="currentColor"
          mt="xs"
          leftSection={<IconMessageCirclePlus />}
          onClick={startEditing}
        >
          Add Reply
        </Button>
      )}
    </Card>
  );
};
export default FeedbackEntryComponent;
