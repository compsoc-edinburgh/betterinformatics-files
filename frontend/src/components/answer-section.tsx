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
  onSectionChange: () => void;
}

interface State {
  section?: AnswerSection;
}

const styles = {
  wrapper: css({
    border: "1px solid green",
  }),
};

export default class AnswerSectionComponent extends React.Component<Props, State> {

  state: State = {};

  async componentWillMount() {
    loadAnswerSection(this.props.filename, this.props.oid)
      .then((res) => this.setState({section: res}));
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
    fetchpost(`/api/exam/${this.props.filename}/setanswer/${this.props.oid}`, {text: ""})
      .then((res) => res.json())
      .then((res) => {
        let answersection = res.value.answersection;
        answersection.key = this.props.oid;
        answersection.kind = SectionKind.Answer;
        this.setState({section: answersection});
      });
  };

  render() {
    const {section} = this.state;
    if (!section) {
      return <div>Loading...</div>
    }
    return (
      <div {...styles.wrapper}>
        <div>
          <b>Answer section</b>
        </div>
        <button onClick={this.removeSection}>Remove Section</button>
        <div>Marked by {section.asker}</div>
        <div>{section.answers.map(e => <Answer key={e.oid} answer={e}/>)}</div>
        {section.allow_new_answer && <button onClick={this.addAnswer}>Add Answer</button>}
      </div>
    );
  }
}
