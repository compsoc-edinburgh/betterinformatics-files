import * as React from "react";
import { AnswerSection, SectionKind } from "../interfaces";
import { loadAnswerSection } from "../exam-loader";
import { fetchpost } from "../fetch-utils";
import { css } from "glamor";
import AnswerComponent from "./answer";

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
  state: State = {};

  componentDidMount() {
    loadAnswerSection(this.props.filename, this.props.oid)
      .then(res => {
        this.setState({ section: res });
        const hash = window.location.hash.substr(1);
        const hashAnswer = res.answers.find(answer => answer.oid === hash);
        if (hashAnswer) {
          this.props.onToggleHidden();
          hashAnswer.divRef.scrollIntoView();
        }
      })
      .catch(() => undefined);
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.cutVersion !== this.props.cutVersion) {
      loadAnswerSection(this.props.filename, this.props.oid)
        .then(res => {
          this.setState({ section: res });
        })
        .catch(() => undefined);
    }
  }

  removeSection = async () => {
    const confirmation = confirm("Remove answer section with all answers?");
    if (confirmation) {
      fetchpost(`/api/exam/${this.props.filename}/removeanswersection`, {
        oid: this.props.oid,
      }).then(() => {
        this.props.onSectionChange();
      });
    }
  };

  addAnswer = (legacy: boolean) => {
    const postdata = legacy ? { legacyuser: 1 } : {};
    fetchpost(
      `/api/exam/${this.props.filename}/addanswer/${this.props.oid}`,
      postdata,
    )
      .then(res => {
        this.onSectionChanged(res);
        if (this.state.section && this.props.hidden) {
          this.props.onToggleHidden();
        }
      })
      .catch(() => undefined);
  };

  // takes the parsed json for the answersection which was returned from the server
  onSectionChanged = (res: { value: { answersection: AnswerSection } }) => {
    const answersection = res.value.answersection;
    //answersection.key = this.props.oid;
    answersection.kind = SectionKind.Answer;
    this.setState({ section: answersection });
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
        {section.answers.length > 0 && (
          <div {...styles.answerWrapper}>
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
              />
            ))}
          </div>
        )}
        <div key="showhidebutton" {...styles.threebuttons}>
          <div {...styles.leftButton}>
            {(section.allow_new_answer || section.allow_new_legacy_answer) && (
              <div>
                <button
                  className="primary"
                  title={
                    section.allow_new_answer && section.allow_new_legacy_answer
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
