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
    border: "1px solid green",
  }),
};

export default class AnswerSectionComponent extends React.Component<Props, State> {

  state: State = {
    hidden: true
  };

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
    fetchpost(`/api/exam/${this.props.filename}/addanswer/${this.props.oid}`, {})
      .then((res) => res.json())
      .then((res) => {
        this.onSectionChanged(res);
      });
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
        <button onClick={this.toggleHidden}>Show Section</button>
      </div>);
    }
    return (
      <div {...styles.wrapper}>
        <button onClick={this.toggleHidden}>Hide Section</button>
        {this.props.canDelete && <button onClick={this.removeSection}>Remove Section</button>}
        <div>{section.answers.map(e =>
          <Answer key={e.oid} answer={e} filename={this.props.filename} sectionId={this.props.oid} onSectionChanged={this.onSectionChanged}/>
        )}</div>
        {section.allow_new_answer && <div><button onClick={this.addAnswer}>Add Answer</button></div>}
      </div>
    );
  }
}
