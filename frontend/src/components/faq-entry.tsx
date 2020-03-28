import * as React from "react";
import { css } from "glamor";
import { FAQEntry } from "../interfaces";
import moment from "moment";
import { fetchpost } from "../fetch-utils";
import Colors from "../colors";
import GlobalConsts from "../globalconsts";

interface Props {
  entry: FAQEntry;
  prevEntry?: FAQEntry;
  nextEntry?: FAQEntry;
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
    marginLeft: "-10px",
    marginRight: "-10px",
    marginTop: "-10px",
    padding: "7px",
    paddingLeft: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }),
  buttons: css({
    margin: "0",
  }),
  question: css({
    fontWeight: "bold",
  }),
  answer: css({
    marginTop: "-10px",
  }),
};

export default class FAQEntryComponent extends React.Component<Props> {
  wrapText = (text: string) => {
    const textSplit = text.split("\n");
    return textSplit.map(t => <p key={t}>{t}</p>);
  };

  remove = () => {
    fetchpost(`/api/faq/remove/${this.props.entry.oid}/`, {})
      .then(() => this.props.entryChanged())
      .catch(() => undefined);
  };

  swap = (other: FAQEntry) => {
    const me = this.props.entry;
    fetchpost(`/api/faq/set/${me.oid}/`, {
      question: me.question,
      answer: me.answer,
      order: other.order,
    })
      .then(() =>
        fetchpost(`/api/faq/set/${other.oid}/`, {
          question: other.question,
          answer: other.answer,
          order: me.order,
        }),
      )
      .then(() => this.props.entryChanged())
      .catch(() => undefined);
  };

  moveUp = () => {
    if (this.props.prevEntry) {
      this.swap(this.props.prevEntry);
    }
  };

  moveDown = () => {
    if (this.props.nextEntry) {
      this.swap(this.props.nextEntry);
    }
  };

  render() {
    const entry = this.props.entry;

    return (
      <div {...styles.wrapper}>
        <div {...styles.header}>
          <div {...styles.question}>{entry.question}</div>
          <div {...styles.buttons}>
            <button onClick={this.moveUp} disabled={!this.props.prevEntry}>
              Up
            </button>
            <button onClick={this.moveDown} disabled={!this.props.nextEntry}>
              Down
            </button>
            <button onClick={this.remove}>Remove</button>
          </div>
        </div>
        <div {...styles.answer}>{this.wrapText(entry.answer)}</div>
      </div>
    );
  }
}
