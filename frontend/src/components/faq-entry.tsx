import * as React from "react";
import { css } from "glamor";
import { FAQEntry } from "../interfaces";
import {fetchdelete, fetchpost, fetchput, imageHandler} from "../fetch-utils";
import Colors from "../colors";
import Editor from "./Editor";
import MarkdownText from "./markdown-text";
import { UndoStack } from "./Editor/utils/undo-stack";

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
  undoStack: UndoStack;
}

export default class FAQEntryComponent extends React.Component<Props, State> {
  state: State = {
    editing: false,
    newQuestion: "",
    newAnswer: "",
    undoStack: { prev: [], next: [] },
  };

  remove = () => {
    if (window.confirm("Do you really want to remove this entry?")) {
      fetchdelete(`/api/faq/${this.props.entry.oid}/`)
        .then(() => this.props.entryChanged())
        .catch(() => undefined);
    }
  };

  swap = (other: FAQEntry) => {
    const me = this.props.entry;
    fetchput(`/api/faq/${me.oid}/`, {
      question: me.question,
      answer: me.answer,
      order: other.order,
    })
      .then(() =>
        fetchput(`/api/faq/${other.oid}/`, {
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
      undoStack: { prev: [], next: [] },
    });
  };

  save = () => {
    fetchput(`/api/faq/${this.props.entry.oid}/`, {
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
          <Editor
            value={this.state.newAnswer}
            onChange={newValue => this.setState({ newAnswer: newValue })}
            imageHandler={imageHandler}
            preview={str => <MarkdownText value={str} />}
            undoStack={this.state.undoStack}
            setUndoStack={undoStack => this.setState({ undoStack })}
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
        <div {...styles.answer}>
          <MarkdownText value={entry.answer} />
        </div>
      </div>
    );
  }
}
