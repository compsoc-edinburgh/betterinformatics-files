import * as React from "react";
import { AnswerSection, SectionKind } from "../interfaces";
import { loadAnswerSection } from "../exam-loader";
import { fetchPost } from "../fetch-utils";
import { css } from "glamor";
import AnswerComponent from "./answer";
import GlobalConsts from "../globalconsts";
import moment from "moment";

interface Props {
  isAdmin: boolean;
  isExpert: boolean;
  filename: string;
  oid: string;
  width: number;
  canDelete: boolean;
  onSectionChange: () => void;
  onToggleHidden: () => void;
  hidden: boolean;
  cutVersion: number;
}

interface State {
  section?: AnswerSection;
  addingAnswer: boolean;
  addingLegacyAnswer: boolean;
}

const styles = {
  wrapper: css({
    width: "80%",
    margin: "20px auto",
    "@media (max-width: 699px)": {
      width: "95%",
    },
  }),
  threebuttons: css({
    textAlign: "center",
    display: "flex",
    justifyContent: "space-between",
    "& > div": {
      width: ["200px", "calc(100% / 3)"],
    },
  }),
  leftButton: css({
    textAlign: "left",
  }),
  rightButton: css({
    textAlign: "right",
  }),
  answerWrapper: css({
    marginBottom: "10px",
  }),
  divideLine: css({
    width: "100%",
    height: "1px",
    margin: "0",
    backgroundColor: "black",
    position: "relative",
    bottom: "20px",
    zIndex: "-100",
    "@media (max-width: 699px)": {
      display: "none",
    },
  }),
};

export default class AnswerSectionComponent extends React.Component<
  Props,
  State
> {
  state: State = {
    addingAnswer: false,
    addingLegacyAnswer: false,
  };

  componentDidMount() {
    loadAnswerSection(this.props.oid)
      .then(res => {
        this.setState({ section: res });
        const hash = window.location.hash.substr(1);
        const hashAnswer = res.answers.find(answer => answer.longId === hash);
        if (hashAnswer) {
          this.props.onToggleHidden();
          if (hashAnswer.divRef) {
            hashAnswer.divRef.scrollIntoView();
          }
        }
      })
      .catch(() => undefined);
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.cutVersion !== this.props.cutVersion) {
      loadAnswerSection(this.props.oid)
        .then(res => {
          this.setState({ section: res });
        })
        .catch(() => undefined);
    }
  }

  removeSection = async () => {
    // eslint-disable-next-line no-restricted-globals
    const confirmation = confirm("Remove answer section with all answers?");
    if (confirmation) {
      fetchPost(`/api/exam/removecut/${this.props.oid}/`, {}).then(() => {
        this.props.onSectionChange();
      });
    }
  };

  addAnswer = (legacy: boolean) => {
    this.setState({
      addingAnswer: true,
      addingLegacyAnswer: legacy,
    });
    if (this.props.hidden) {
      this.props.onToggleHidden();
    }
  };

  // takes the parsed json for the answersection which was returned from the server
  onSectionChanged = (res: { value: AnswerSection }) => {
    const answersection = res.value;
    //answersection.key = this.props.oid;
    answersection.kind = SectionKind.Answer;
    this.setState({
      section: answersection,
      addingAnswer: false,
      addingLegacyAnswer: false,
    });
  };

  onCancelEdit = () => {
    this.setState({
      addingAnswer: false,
      addingLegacyAnswer: false,
    });
  };

  render() {
    const { section } = this.state;
    if (!section) {
      return <div>Loading...</div>;
    }
    if (this.props.hidden && section.answers.length > 0) {
      return (
        <div {...styles.wrapper}>
          <div key="showhidebutton" {...styles.threebuttons}>
            <div />
            <div>
              <button onClick={this.props.onToggleHidden}>Show Answers</button>
            </div>
            <div />
          </div>
          <div {...styles.divideLine} />
        </div>
      );
    }
    return (
      <div {...styles.wrapper}>
        {(section.answers.length > 0 || this.state.addingAnswer) && (
          <div {...styles.answerWrapper}>
            {this.state.addingAnswer && (
              <AnswerComponent
                isReadonly={false}
                isAdmin={this.props.isAdmin}
                isExpert={this.props.isExpert}
                filename={this.props.filename}
                sectionId={this.props.oid}
                answer={{
                  oid: "",
                  longId: "",
                  upvotes: 1,
                  expertvotes: 0,
                  authorId: "",
                  authorDisplayName: this.state.addingLegacyAnswer
                    ? "New Legacy Answer"
                    : "New Answer",
                  canEdit: true,
                  isUpvoted: true,
                  isDownvoted: false,
                  isExpertVoted: false,
                  isFlagged: false,
                  flagged: 0,
                  comments: [],
                  text: "",
                  time: moment().format(GlobalConsts.momentParseString),
                  edittime: moment().format(GlobalConsts.momentParseString),
                  filename: this.props.filename,
                  sectionId: this.props.oid,
                  isLegacyAnswer: this.state.addingLegacyAnswer,
                }}
                onSectionChanged={this.onSectionChanged}
                onCancelEdit={this.onCancelEdit}
              />
            )}
            {section.answers.map(e => (
              <AnswerComponent
                key={e.oid}
                isReadonly={false}
                isAdmin={this.props.isAdmin}
                isExpert={this.props.isExpert}
                answer={e}
                filename={this.props.filename}
                sectionId={this.props.oid}
                onSectionChanged={this.onSectionChanged}
                onCancelEdit={this.onCancelEdit}
              />
            ))}
          </div>
        )}
        <div key="showhidebutton" {...styles.threebuttons}>
          <div {...styles.leftButton}>
            {(section.allow_new_answer || section.allow_new_legacy_answer) &&
              !this.state.addingAnswer && (
                <div>
                  <button
                    className="primary"
                    title={
                      section.allow_new_answer &&
                      section.allow_new_legacy_answer
                        ? "Hold Shift to add a Legacy Answer"
                        : undefined
                    }
                    onClick={ev =>
                      this.addAnswer(
                        !section.allow_new_answer ||
                          (section.allow_new_legacy_answer && ev.shiftKey),
                      )
                    }
                  >
                    {section.allow_new_answer
                      ? "Add Answer"
                      : "Add Legacy Answer"}
                  </button>
                </div>
              )}
          </div>
          <div>
            {section.answers.length > 0 && (
              <button onClick={this.props.onToggleHidden}>Hide Answers</button>
            )}
          </div>
          <div {...styles.rightButton}>
            {this.props.canDelete && (
              <button onClick={this.removeSection}>
                Remove Answer Section
              </button>
            )}
          </div>
        </div>
        <div {...styles.divideLine} />
      </div>
    );
  }
}
