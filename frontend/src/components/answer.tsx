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
  commentDraft: string;
}

const styles = {
  wrapper: css({
    border: "1px solid blue",
    marginLeft: "15px",
  }),
};

export default class AnswerComponent extends React.Component<Props, State> {

  state: State = {
    editing: this.props.answer.text.length === 0,
    savedText: this.props.answer.text,
    text: this.props.answer.text,
    commentDraft: ""
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

  answerTextareaChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    this.setState({text: event.currentTarget.value});
  };

  commentTextareaChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    this.setState({commentDraft: event.currentTarget.value});
  };

  toggleAnswerUpvote = async () => {
    fetchpost(`/api/exam/${this.props.filename}/setlike/${this.props.sectionId}/${this.props.answer.oid}`, {like: this.props.answer.isUpvoted ? 0 : 1})
      .then((res) => res.json())
      .then((res) => {
        this.props.onSectionChanged(res);
      });
  };

  addComment = async () => {
    fetchpost(`/api/exam/${this.props.filename}/addcomment/${this.props.sectionId}/${this.props.answer.oid}`, {text: this.state.commentDraft})
      .then((res) => res.json())
      .then((res) => {
        this.props.onSectionChanged(res);
      });
    this.setState({commentDraft: ""});
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
            <textarea onChange={this.answerTextareaChange} cols={120} rows={20} value={this.state.text}/>
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
        <div>{answer.comments.map(e =>
          <Comment key={e.oid} comment={e} filename={this.props.filename} sectionId={this.props.sectionId} answerId={answer.oid} onSectionChanged={this.props.onSectionChanged}/>
        )}</div>
        {this.state.savedText.length > 0 && <div>
          <b>Add comment</b>
          <div><MathText value={this.state.commentDraft} /></div>
          <div>
            <textarea onChange={this.commentTextareaChange} cols={80} rows={5} value={this.state.commentDraft} />
          </div>
          <div>
            <button onClick={this.addComment}>Add comment</button>
          </div>
        </div>}
      </div>
    );
  }
};
