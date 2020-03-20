import * as React from "react";
import { css } from "glamor";
import { FeedbackEntry } from "../interfaces";
import moment from "moment";
import { fetchpost } from "../fetch-utils";
import Colors from "../colors";
import GlobalConsts from "../globalconsts";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  ButtonGroup,
} from "@vseth/components";
import TwoButtons from "./two-buttons";
import { useRequest } from "@umijs/hooks";

const setFlag = async (oid: string, flag: "done" | "read", value: boolean) => {
  await fetchpost(`/api/feedback/flags/${oid}/`, {
    [flag]: value,
  });
};
const wrapText = (text: string) => {
  const textSplit = text.split("\n");
  return textSplit.map(t => <p key={t}>{t}</p>);
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
    <Card style={{ margin: "0.5em" }}>
      <CardHeader>
        <TwoButtons
          left={
            <h6>
              {entry.authorDisplayName} •{" "}
              {moment(entry.time, GlobalConsts.momentParseString).format(
                GlobalConsts.momentFormatString,
              )}
            </h6>
          }
          right={
            <ButtonGroup>
              <Button
                color={entry.done ? "secondary" : "primary"}
                onClick={() => runSetFlag("done", !entry.done)}
              >
                {entry.done ? "Set Undone" : "Set Done"}
              </Button>
              <Button
                color={entry.read ? "secondary" : "primary"}
                onClick={() => runSetFlag("read", !entry.read)}
              >
                {entry.read ? "Set Unread" : "Set Read"}
              </Button>
            </ButtonGroup>
          }
        />
      </CardHeader>
      <CardBody>{wrapText(entry.text)}</CardBody>
    </Card>
  );
};
export default FeedbackEntryComponent;
