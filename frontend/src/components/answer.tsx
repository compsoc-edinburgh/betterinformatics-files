import * as React from "react";
import {Answer, AnswerSection} from "../interfaces";
import Comment from "./comment";
import {css} from "glamor";
import MathText from "./math-text";
import {fetchpost} from '../fetch-utils'

interface Props {
  filename: string;
  sectionId: string;
  answer: Answer;
  onSectionChanged: (res: {value: {answersection: AnswerSection}}) => void;
}

interface State {
  editing: boolean;
  text: string;
  savedText: string;
}

const styles = {
  wrapper: css({
    border: "1px solid blue",
    marginLeft: "15px",
  }),
};

export default class AnswerComponent extends React.Component<Props, State> {

  state: State = {
    editing: false,
    savedText: this.props.answer.text,
    text: this.props.answer.text
  };

  removeAnswer = async () => {
    const confirmation = confirm("Remove answer?");
    if (confirmation) {
      fetchpost(`/api/exam/${this.props.filename}/removeanswer/${this.props.sectionId}`, {})
        .then((res) => res.json())
        .then((res) => {
          this.props.onSectionChanged(res);
        });
    }
  };

  saveAnswer = async () => {
    fetchpost(`/api/exam/${this.props.filename}/setanswer/${this.props.sectionId}`, {text: this.state.text}).then(() => {
      this.setState(prevState => ({
        editing: false,
        savedText: prevState.text
      }));
    });
  };

  cancelEdit = async () => {
    this.setState(prevState => ({
      editing: false,
      text: prevState.savedText
    }));
  };

  startEdit = async () => {
    this.setState({editing: true});
  };

  textareaChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    this.setState({text: event.currentTarget.value});
  };

  toggleAnswerUpvote = async () => {
    fetchpost(`/api/exam/${this.props.filename}/setlike/${this.props.sectionId}/${this.props.answer.oid}`, {like: this.props.answer.isUpvoted ? 0 : 1})
      .then((res) => res.json())
      .then((res) => {
        this.props.onSectionChanged(res);
      });
  };

  render() {
    const {answer} = this.props;
    return (
      <div {...styles.wrapper}>
        <div>
          <b>Answer</b> by {answer.authorId}
        </div>
        <div>Time: {answer.time}</div>
        <div>Upvotes: {answer.upvotes.length}</div>
        <div><MathText value={this.state.text}/></div>
        {this.state.editing && <div>
          <div>
            <textarea onChange={this.textareaChange} cols={120} rows={20} value={this.state.text}/>
          </div>
          <div>
            <button onClick={this.saveAnswer}>Save Answer</button>
            <button onClick={this.cancelEdit}>Cancel</button>
          </div>
          <div>
            You can use latex math notation in your answer. Use \[ ... \] and \( ... \) or alternatively $$ ... $$ and ` ... ` to format the enclosed text as math. Using ` ... ` you can also use AsciiMath.
          </div>
        </div>}
        {answer.canEdit && !this.state.editing && <div>
          <button onClick={this.startEdit}>Edit Answer</button>
          <button onClick={this.removeAnswer}>Delete Answer</button>
          <button onClick={this.toggleAnswerUpvote}>{answer.isUpvoted && "Remove Upvote" || "Upvote"}</button>
        </div>}
        <div>{answer.comments.map(e => <Comment key={e.oid} comment={e}/>)}</div>
      </div>
    );
  }
};
