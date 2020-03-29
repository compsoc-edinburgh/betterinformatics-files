import * as React from "react";
import { css } from "glamor";
import { FAQEntry } from "../interfaces";
import moment from "moment";
import { fetchpost } from "../fetch-utils";
import Colors from "../colors";
import GlobalConsts from "../globalconsts";

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
  answerEdit: css({
    paddingRight: "14px",
  }),
  inputElPar: css({
    flexGrow: 1,
  }),
  inputEl: css({
    width: "100%",
    marginLeft: 0,
    marginRight: 0,
  }),
  answerInputEl: css({
    width: "100%",
    padding: "5px",
  }),
};

interface Props {
  isAdmin?: boolean;
  entry: FAQEntry;
  prevEntry?: FAQEntry;
  nextEntry?: FAQEntry;
  entryChanged: () => void;
}

interface State {
  editing: boolean;
  newQuestion: string;
  newAnswer: string;
}

export default class FAQEntryComponent extends React.Component<Props, State> {
  state: State = {
    editing: false,
    newQuestion: "",
    newAnswer: "",
  };

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

  startEdit = () => {
    this.setState({
      editing: true,
      newQuestion: this.props.entry.question,
      newAnswer: this.props.entry.answer,
    });
  };

  save = () => {
    fetchpost(`/api/faq/set/${this.props.entry.oid}/`, {
      question: this.state.newQuestion,
      answer: this.state.newAnswer,
      order: this.props.entry.order,
    })
      .then(() => {
        this.setState({
          editing: false,
        });
        this.props.entryChanged();
      })
      .catch(() => undefined);
  };

  cancel = () => {
    this.setState({
      editing: false,
    });
  };

  render_edit() {
    return (
      <div {...styles.wrapper}>
        <div {...styles.header}>
          <div {...styles.inputElPar}>
            <input
              {...styles.inputEl}
              type="text"
              placeholder="Question"
              title="Question"
              onChange={event =>
                this.setState({ newQuestion: event.currentTarget.value })
              }
              value={this.state.newQuestion}
            />
          </div>
          <div {...styles.buttons}>
            <button onClick={this.save}>Save</button>
            <button onClick={this.cancel}>Cancel</button>
          </div>
        </div>
        <div {...styles.answerEdit}>
          <textarea
            {...styles.answerInputEl}
            placeholder="Answer"
            rows={5}
            onChange={event =>
              this.setState({ newAnswer: event.currentTarget.value })
            }
            value={this.state.newAnswer}
          />
        </div>
      </div>
    );
  }

  render() {
    if (this.state.editing) {
      return this.render_edit();
    }

    const entry = this.props.entry;

    return (
      <div {...styles.wrapper}>
        <div {...styles.header}>
          <div {...styles.question}>{entry.question}</div>
          {this.props.isAdmin && (
            <div {...styles.buttons}>
              <button onClick={this.moveUp} disabled={!this.props.prevEntry}>
                Up
              </button>
              <button onClick={this.moveDown} disabled={!this.props.nextEntry}>
                Down
              </button>
              <button onClick={this.startEdit}>Edit</button>
              <button onClick={this.remove}>Remove</button>
            </div>
          )}
        </div>
        <div {...styles.answer}>{this.wrapText(entry.answer)}</div>
      </div>
    );
  }
}
