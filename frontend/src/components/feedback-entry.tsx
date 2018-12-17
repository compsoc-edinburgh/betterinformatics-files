import * as React from "react";
import {css} from "glamor";
import {FeedbackEntry} from "../interfaces";
import * as moment from "moment";
import {fetchpost} from "../fetch-utils";

interface Props {
  entry: FeedbackEntry;
  entryChanged: () => void;
}

const styles = {
  wrapper: css({
    marginTop: "10px",
  })
};

export default class FeedbackEntryComponent extends React.Component<Props> {

  setRead = (value: boolean) => {
    fetchpost(`/api/feedback/${this.props.entry.oid}/flags`, {read: value ? 1 : 0})
      .then(() => this.props.entryChanged())
      .catch(() => undefined);
  };

  setDone = (value: boolean) => {
    fetchpost(`/api/feedback/${this.props.entry.oid}/flags`, {done: value ? 1 : 0})
      .then(() => this.props.entryChanged())
      .catch(() => undefined);
  };

  render() {
    const entry = this.props.entry;

    return (<div {...styles.wrapper}>
      <div>{entry.authorDisplayName} @ {moment(entry.time, "YYYY-MM-DDTHH:mm:ss.SSSSSSZZ").format("DD.MM.YYYY HH:mm")}</div>
      <div>{entry.text}</div>
      <div>
        <button onClick={() => this.setDone(!entry.done)}>{entry.done ? "Set Undone" : "Set Done"}</button>
        <button onClick={() => this.setRead(!entry.read)}>{entry.read ? "Set Unread" : "Set Read"}</button>
      </div>
    </div>);
  }
};
