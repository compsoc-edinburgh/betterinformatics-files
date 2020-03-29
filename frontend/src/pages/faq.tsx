import * as React from "react";
import { css } from "glamor";
import { fetchapi, fetchpost } from "../fetch-utils";
import { FAQEntry } from "../interfaces";
import FAQEntryComponent from "../components/faq-entry";

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
    paddingRight: "12px",
  }),
  answerInputEl: css({
    width: "100%",
    padding: "5px",
  }),
  submitButton: css({
    marginLeft: 0,
    marginRIght: 0,
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
}

export default class FAQ extends React.Component<Props, State> {
  state: State = {
    newQuestion: "",
    newAnswer: "",
  };

  componentDidMount() {
    this.loadFAQs();
    document.title = "FAQ - VIS Community Solutions";
  }

  loadFAQs = () => {
    fetchapi("/api/faq/list").then(res => {
      this.setState({
        faqs: res.value,
      });
    });
  };

  addFAQ = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    let newOrder = this.state.faqs
      ? Math.max(...this.state.faqs.map(x => x.order)) + 1
      : 0;

    fetchpost("/api/faq/add/", {
      question: this.state.newQuestion,
      answer: this.state.newAnswer,
      order: newOrder,
    })
      .then(res => {
        this.setState({
          newQuestion: "",
          newAnswer: "",
          err: "",
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
