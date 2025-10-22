import { useRequest } from "@umijs/hooks";
import { Button, Card, Group, Title, Text } from "@mantine/core";
import moment from "moment";
import * as React from "react";
import { fetchPost } from "../api/fetch-utils";
import GlobalConsts from "../globalconsts";
import { FeedbackEntry } from "../interfaces";
import displayNameClasses from "../utils/display-name.module.css";
import TooltipButton from "./TooltipButton";
import { IconCheckbox, IconMail, IconMailOpened, IconSquare } from "@tabler/icons-react";

const setFlag = async (oid: string, flag: "done" | "read", value: boolean) => {
  await fetchPost(`/api/feedback/flags/${oid}/`, {
    [flag]: value,
  });
};
const wrapText = (text: string) => {
  const textSplit = text.split("\n");
  return textSplit.map(t => (
    <Text pt="xs" key={t}>
      {t}
    </Text>
  ));
};

interface Props {
  entry: FeedbackEntry;
  entryChanged: () => void;
}
const FeedbackEntryComponent: React.FC<Props> = ({ entry, entryChanged }) => {
  const { run: runSetFlag } = useRequest(
    (flag: "done" | "read", value: boolean) => setFlag(entry.oid, flag, value),
    { manual: true, onSuccess: entryChanged },
  );
  return (
    <Card my="xs" withBorder shadow="md">
      <Card.Section withBorder inheritPadding>
        <Group py="md" justify="space-between">
          <Title order={4} className={displayNameClasses.shrinkableDisplayName}>
            {entry.authorDisplayName} •{" "}
            {moment(entry.time, GlobalConsts.momentParseString).format(
              GlobalConsts.momentFormatString,
            )}
          </Title>
          <Button.Group>
            <TooltipButton
              variant={entry.done ? "default" : "filled"}
              tooltip={`Mark as ${entry.done ? "Not Done" : "Done"}`}
              onClick={() => runSetFlag("done", !entry.done)}>
              {entry.done ? <IconCheckbox /> : <IconSquare />}
            </TooltipButton>
            <TooltipButton
              variant={entry.read ? "default" : "filled"}
              tooltip={`Mark as ${entry.read ? "Unread" : "Read"}`}
              color={entry.read ? "brand.7" : "brand"}
              onClick={() => runSetFlag("read", !entry.read)}>
              {entry.read ? <IconMail /> :  <IconMailOpened />}
            </TooltipButton>
          </Button.Group>
        </Group>
      </Card.Section>
      {wrapText(entry.text)}
    </Card>
  );
};
export default FeedbackEntryComponent;
