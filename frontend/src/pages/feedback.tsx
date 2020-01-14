import * as React from "react";
import { css } from "glamor";
import { fetchapi, fetchpost } from "../fetch-utils";
import { FeedbackEntry } from "../interfaces";
import FeedbackEntryComponent from "../components/feedback-entry";

const styles = {
  wrapper: css({
    maxWidth: "600px",
    margin: "auto",
  }),
  feedbackWrapper: css({
    marginTop: "10px",
    marginBottom: "10px",
  }),
  feedbackTextarea: css({
    width: "100%",
    resize: "vertical",
    padding: "5px",
    boxSizing: "border-box",
  }),
  submitButton: css({
    textAlign: "right",
    "& button": {
      width: "50%",
    },
  }),
  feedbackButton: css({
    textAlign: "center",
  }),
};

interface Props {
  isAdmin?: boolean;
}

interface State {
  feedbackText: string;
  result?: string;
  feedbackVisible: boolean;
  requestedFeedbacks: boolean;
  feedbacks?: FeedbackEntry[];
}

export default class Feedback extends React.Component<Props, State> {
  state: State = {
    feedbackText: "",
    feedbackVisible: window.location.search === "?show",
    requestedFeedbacks: false,
  };

  componentDidMount() {
    if (this.props.isAdmin) {
      this.loadFeedbacks();
    }
    document.title = "Feedback - VIS Community Solutions";
  }

  componentDidUpdate() {
    if (this.props.isAdmin && !this.state.requestedFeedbacks) {
      this.loadFeedbacks();
    }
  }

  feedbackTextareaChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    this.setState({
      feedbackText: event.currentTarget.value,
    });
  };

  submitFeedback = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    fetchpost("/api/feedback/submit/", {
      text: this.state.feedbackText,
    })
      .then(() => {
        this.setState({
          feedbackText: "",
          result: "Feedback submitted, thank you!",
        });
        this.loadFeedbacks();
      })
      .catch(() => {
        this.setState({
          result: "Could not submit feedback. Please try again later.",
        });
      });
  };

  loadFeedbacks = () => {
    this.setState({
      requestedFeedbacks: true,
    });
    fetchapi("/api/feedback/list/")
      .then(res => {
        const getScore = (a: FeedbackEntry) =>
          (a.read ? 10 : 0) + (a.done ? 1 : 0);
        res.value.sort(
          (a: FeedbackEntry, b: FeedbackEntry) => getScore(a) - getScore(b),
        );
        this.setState({
          feedbacks: res.value,
        });
      })
      .catch(() => undefined);
  };

  toggleFeedbacks = () => {
    this.setState(prevState => ({
      feedbackVisible: !prevState.feedbackVisible,
    }));
  };

  render() {
    return (
      <div {...styles.wrapper}>
        <div>
          <h1>Feedback</h1>
          <p>
            Please tell us what you think about the new Community Solutions!
            <br />
            What do you like? What could we improve? Ideas for new features?
          </p>
          <p>
            Use the form below or write to{" "}
            <a href="mailto:communitysolutions@vis.ethz.ch">
              communitysolutions@vis.ethz.ch
            </a>
            .
          </p>
          <p>
            To report issues with the platform you can open an issue in our{" "}
            <a
              href="https://gitlab.ethz.ch/vis/cat/community-solutions/issues"
              target="_blank"
            >
              issue tracker
            </a>
            .
          </p>
        </div>
        <div {...styles.feedbackWrapper}>
          {this.state.result && <p>{this.state.result}</p>}
          <form onSubmit={this.submitFeedback}>
            <div>
              <textarea
                autoFocus={true}
                {...styles.feedbackTextarea}
                onChange={this.feedbackTextareaChange}
                cols={120}
                rows={20}
                value={this.state.feedbackText}
              />
            </div>
            {this.state.feedbackText.length > 0 && (
              <div {...styles.submitButton}>
                <button type="submit">Send</button>
              </div>
            )}
          </form>
        </div>
        {this.props.isAdmin && window.location.search === "?show" && (
          <div {...styles.feedbackButton}>
            <button onClick={this.toggleFeedbacks}>
              {this.state.feedbackVisible ? "Hide Feedback" : "Show Feedback"}
            </button>
          </div>
        )}
        {this.state.feedbackVisible && this.state.feedbacks && (
          <div>
            {this.state.feedbacks.map(fb => (
              <FeedbackEntryComponent
                key={fb.oid}
                entry={fb}
                entryChanged={this.loadFeedbacks}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}
