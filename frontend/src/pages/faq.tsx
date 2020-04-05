import * as React from "react";
import { css } from "glamor";
import { fetchGet, fetchPost, imageHandler } from "../api/fetch-utils";
import { FAQEntry } from "../interfaces";
import Editor from "../components/Editor";
import FAQEntryComponent from "../components/faq-entry";
import MarkdownText from "../components/markdown-text";
import { UndoStack } from "../components/Editor/utils/undo-stack";
import Colors from "../colors";

const styles = {
  wrapper: css({
    maxWidth: "900px",
    margin: "auto",
  }),
  inputEl: css({
    width: "100%",
    marginLeft: 0,
    marginRight: 0,
  }),
  answerInputElPar: css({
    padding: "7px",
    border: "1px solid " + Colors.inputBorder,
    borderRadius: "2px",
    boxSizing: "border-box",
    backgroundColor: "white",
  }),
  answerInputEl: css({
    width: "100%",
    padding: "5px",
  }),
  submitButton: css({
    marginLeft: 0,
    marginRight: 0,
    minWidth: "100px",
  }),
};

interface Props {
  isAdmin?: boolean;
}

interface State {
  faqs?: FAQEntry[];
  newQuestion: string;
  newAnswer: string;
  err?: string;
  undoStack: UndoStack;
}

export default class FAQ extends React.Component<Props, State> {
  state: State = {
    newQuestion: "",
    newAnswer: "",
    undoStack: { prev: [], next: [] },
  };

  componentDidMount() {
    this.loadFAQs();
    document.title = "FAQ - VIS Community Solutions";
  }

  loadFAQs = () => {
    fetchGet("/api/faq/").then(res => {
      this.setState({
        faqs: res.value,
      });
    });
  };

  addFAQ = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const newOrder =
      this.state.faqs !== undefined && this.state.faqs.length > 0
        ? Math.max(...this.state.faqs.map(x => x.order)) + 1
        : 0;

    fetchPost("/api/faq/", {
      question: this.state.newQuestion,
      answer: this.state.newAnswer,
      order: newOrder,
    })
      .then(res => {
        this.setState({
          newQuestion: "",
          newAnswer: "",
          err: "",
          undoStack: { prev: [], next: [] },
        });
        this.loadFAQs();
      })
      .catch(res => {
        this.setState({
          err: res,
        });
      });
  };

  render() {
    const faqs = this.state.faqs;
    return (
      <div {...styles.wrapper}>
        <div>
          <h1>FAQs</h1>
          <p>
            If you have any question not yet answered below, feel free to
            contact us at{" "}
            <a href="mailto:communitysolutions@vis.ethz.ch">
              communitysolutions@vis.ethz.ch
            </a>
            .
          </p>
        </div>
        {this.props.isAdmin && (
          <div>
            {this.state.err && <div>{this.state.err}</div>}
            <form onSubmit={this.addFAQ}>
              <div>
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
              <div {...styles.answerInputElPar}>
                <Editor
                  value={this.state.newAnswer}
                  onChange={newValue => this.setState({ newAnswer: newValue })}
                  imageHandler={imageHandler}
                  preview={str => <MarkdownText value={str} />}
                  undoStack={this.state.undoStack}
                  setUndoStack={undoStack => this.setState({ undoStack })}
                />
              </div>
              <div>
                <button
                  {...styles.submitButton}
                  type="submit"
                  disabled={
                    this.state.newQuestion.length === 0 ||
                    this.state.newAnswer.length === 0
                  }
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
        {faqs && (
          <div>
            {faqs.map((faq, idx) => (
              <FAQEntryComponent
                key={faq.oid}
                isAdmin={this.props.isAdmin}
                entry={faq}
                prevEntry={idx > 0 ? faqs[idx - 1] : undefined}
                nextEntry={idx + 1 < faqs.length ? faqs[idx + 1] : undefined}
                entryChanged={this.loadFAQs}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}
