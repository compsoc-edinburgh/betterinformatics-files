import * as React from "react";
import {css} from "glamor";
import {FeedbackEntry} from "../interfaces";
import * as moment from "moment";
import {fetchpost} from "../fetch-utils";
import Colors from "../colors";

interface Props {
  entry: FeedbackEntry;
  entryChanged: () => void;
}

const styles = {
  wrapper: css({
    marginTop: "10px",
    background: Colors.cardBackground,
    padding: "10px",
    marginBottom: "20px",
    boxShadow: Colors.cardShadow,
  }),
  header: css({
    marginBottom: "10px",
    marginLeft: "-10px",
    marginRight: "-10px",
    marginTop: "-10px",
    padding: "7px",
    paddingLeft: "10px",
    background: Colors.cardHeader,
    color: Colors.cardHeaderForeground,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }),
  buttons: css({
    margin: "0"
  }),
  feedbackText: css({
    whiteSpace: "pre",
  }),
  buttonRead: [
    css({
      background: Colors.buttonPrimary,
      ":hover": {
        background: Colors.buttonPrimaryHover,
      }
    }),
    css({}),
  ],
  buttonDone: [
    css({
      background: Colors.buttonPrimary,
      ":hover": {
        background: Colors.buttonPrimaryHover,
      }
    }),
    css({}),
  ]
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
      <div {...styles.header}>
        <div>{entry.authorDisplayName} @ {moment(entry.time, "YYYY-MM-DDTHH:mm:ss.SSSSSSZZ").format("DD.MM.YYYY HH:mm")}</div>
        <div {...styles.buttons}>
          <button {...styles.buttonDone[entry.done?1:0]} onClick={() => this.setDone(!entry.done)}>{entry.done ? "Set Undone" : "Set Done"}</button>
          <button {...styles.buttonRead[entry.read?1:0]} onClick={() => this.setRead(!entry.read)}>{entry.read ? "Set Unread" : "Set Read"}</button>
        </div>
      </div>
      <div {...styles.feedbackText}>{entry.text}</div>
    </div>);
  }
};
