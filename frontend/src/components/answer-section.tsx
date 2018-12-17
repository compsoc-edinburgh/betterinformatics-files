import * as React from "react";
import {AnswerSection, SectionKind} from "../interfaces";
import {loadAnswerSection} from "../exam-loader";
import {fetchpost} from '../fetch-utils'
import {css} from "glamor";
import Answer from "./answer";

interface Props {
  filename: string;
  oid: string;
  width: number;
  canDelete: boolean;
  onSectionChange: () => void;
}

interface State {
  section?: AnswerSection;
  hidden: boolean;
}

const styles = {
  wrapper: css({
    width: "80%",
    margin: "auto"
  }),
  threebuttons: css({
    textAlign: "center",
    display: "flex",
    justifyContent: "space-between",
    "& div": {
      width: "200px"
    }
  }),
  leftButton: css({
    textAlign: "left"
  }),
  rightButton: css({
    textAlign: "right"
  }),
  answerWrapper: css({
    marginBottom: "10px"
  }),
  divideLine: css({
    width: "100%",
    height: "1px",
    margin: "0",
    backgroundColor: "black",
    position: "relative",
    bottom: "20px",
    zIndex: "-100"
  })
};

export default class AnswerSectionComponent extends React.Component<Props, State> {

  state: State = {
    hidden: true
  };

  async componentWillMount() {
    loadAnswerSection(this.props.filename, this.props.oid)
      .then((res) => this.setState({section: res, hidden: res.answers.length > 0}))
      .catch(() => undefined);
  }

  removeSection = async () => {
    const confirmation = confirm("Remove answer section with all answers?");
    if (confirmation) {
      await fetchpost(`/api/exam/${this.props.filename}/removeanswersection`, {
        oid: this.props.oid
      });
      this.props.onSectionChange();
    }
  };

  addAnswer = async () => {
    fetchpost(`/api/exam/${this.props.filename}/addanswer/${this.props.oid}`, {})
      .then((res) => res.json())
      .then((res) => {
        this.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  // takes the parsed json for the answersection which was returned from the server
  onSectionChanged = async (res: {value: {answersection: AnswerSection}}) => {
    let answersection = res.value.answersection;
    //answersection.key = this.props.oid;
    answersection.kind = SectionKind.Answer;
    this.setState({section: answersection});
  };

  toggleHidden = async () => {
    this.setState(prevState => ({hidden: !prevState.hidden}));
  };

  render() {
    const {section} = this.state;
    if (!section) {
      return <div>Loading...</div>;
    }
    if (this.state.hidden) {
      return (<div {...styles.wrapper}>
        <div key="showhidebutton" {...styles.threebuttons}>
          <div/>
          <div><button onClick={this.toggleHidden}>Show Answers</button></div>
          <div/>
        </div>
        <div {...styles.divideLine} />
      </div>);
    }
    return (
      <div {...styles.wrapper}>
        {section.answers.length > 0 && <div {...styles.answerWrapper}>{section.answers.map(e =>
          <Answer key={e.oid} answer={e} filename={this.props.filename} sectionId={this.props.oid} onSectionChanged={this.onSectionChanged}/>
        )}</div>}
        <div key="showhidebutton" {...styles.threebuttons}>
          <div {...styles.leftButton}>{section.allow_new_answer && <div><button className="primary" onClick={this.addAnswer}>Add Answer</button></div>}</div>
          <div><button onClick={this.toggleHidden}>Hide Answers</button></div>
          <div {...styles.rightButton}>{this.props.canDelete && <button onClick={this.removeSection}>Remove Answer Section</button>}</div>
        </div>
        <div {...styles.divideLine} />
      </div>
    );
  }
}
