import * as React from "react";
import {Answer, AnswerSection} from "../interfaces";
import * as moment from 'moment';
import Comment from "./comment";
import {css} from "glamor";
import MarkdownText from "./markdown-text";
import {fetchpost} from '../fetch-utils'
import ImageOverlay from "./image-overlay";

interface Props {
  filename: string;
  sectionId: string;
  answer: Answer;
  onSectionChanged: (res: {value: {answersection: AnswerSection}}) => void;
}

interface State {
  editing: boolean;
  imageDialog: boolean;
  imageCursorPosition: number;
  text: string;
  savedText: string;
  commentDraft: string;
}

const styles = {
  wrapper: css({
    background: "#eeeeee",
    paddingTop: "10px",
    paddingLeft: "10px",
    paddingRight: "10px",
    paddingBottom: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 8px 0 grey"
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
  header: css({
    fontSize: "24px",
    marginBottom: "10px",
    marginLeft: "-10px",
    marginRight: "-10px",
    marginTop: "-10px",
    paddingLeft: "10px",
    paddingRight: "10px",
    paddingTop: "10px",
    paddingBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#394b59",
    color: "white",
  }),
  upvoteWrapper: css({
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    "& div": {
      marginLeft: "10px",
    }
  }),
  upvoteImg: css({
    height: "35px",
    marginBottom: "-7px", // no idea what's going on...
  }),
  answer: css({
    margin: "5px"
  }),
  answerInput: css({
    marginLeft: "5px",
    marginRight: "5px"
  }),
  answerTexHint: css({
    marginBottom: "10px",
    marginLeft: "5px",
    marginRight: "5px"
  }),
  comments: css({
    marginLeft: "25px",
    marginTop: "10px",
    marginRight: "25px"
  }),
  addComment: css({
    marginTop: "20px",
    marginLeft: "25px",
    marginRight: "25px"
  }),
  textareaInput: css({
    width: "100%",
    resize: "vertical",
    marginTop: "10px",
    marginBottom: "5px",
    padding: "5px",
    boxSizing: "border-box"
  })
};

export default class AnswerComponent extends React.Component<Props, State> {

  state: State = {
    editing: this.props.answer.text.length === 0,
    imageDialog: false,
    imageCursorPosition: -1,
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
    fetchpost(`/api/exam/${this.props.filename}/setanswer/${this.props.sectionId}`, {text: this.state.text})
      .then((res) => res.json())
      .then((res) => {
      this.setState(prevState => ({
        editing: false,
        savedText: prevState.text
      }));
      this.props.onSectionChanged(res);
    });
  };

  cancelEdit = async () => {
    this.setState(prevState => ({
      editing: false,
      text: prevState.savedText
    }));
  };

  startEdit = async () => {
    this.setState({
      editing: true,
      imageCursorPosition: -1,
    });
  };

  startImageDialog = () => {
    this.setState({imageDialog: true});
  };

  endImageDialog = (image: string) => {
    if (image.length > 0) {
      const imageTag = `![Image Description](${image})`;
      this.setState(prevState => {
        let newText = prevState.text;
        if (prevState.imageCursorPosition < 0) {
          newText += imageTag;
        } else {
          newText = newText.slice(0, prevState.imageCursorPosition) + imageTag + newText.slice(prevState.imageCursorPosition);
        }
        return {
          imageDialog: false,
          text: newText,
        }
      })
    } else {
      this.setState({imageDialog: false});
    }
  };

  answerTextareaChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    this.setState({
      text: event.currentTarget.value,
      imageCursorPosition: event.currentTarget.selectionStart,
    });
  };

  commentTextareaChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    this.setState({
      commentDraft: event.currentTarget.value,
      imageCursorPosition: -1,
    });
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
        <div {...styles.header}>
          <div>
            <b>{answer.authorDisplayName}</b> @ {moment(answer.time, "YYYY-MM-DDTHH:mm:ss.SSSSSSZZ").format("DD.MM.YYYY HH:mm")}
          </div>
          <div {...styles.upvoteWrapper} onClick={this.toggleAnswerUpvote} title="Upvote Answer">
            <div>{answer.upvotes}</div>
            <div>
              <img {...styles.upvoteImg} src={"/static/upvote" + (answer.isUpvoted ? "_orange" : "_white") + ".svg"} alt="Upvote" />
            </div>
          </div>
        </div>
        <div {...styles.answer}><MarkdownText value={this.state.text}/></div>
        {this.state.editing && <div>
          <div {...styles.answerInput}>
            <textarea {...styles.textareaInput} onKeyUp={this.answerTextareaChange} onChange={this.answerTextareaChange} cols={120} rows={20} value={this.state.text}/>
          </div>
          <div {...styles.answerTexHint}>
            You can use Markdown. Use ``` code ``` for code. Use $ math $ or $$ \n math \n $$ for latex math.
          </div>
        </div>}
        <div {...styles.threebuttons}>
          <div {...styles.leftButton}>
            {this.state.editing && !this.state.imageDialog && <button onClick={this.startImageDialog}>Images</button>}
          </div>
          <div>{this.state.editing && <button onClick={this.saveAnswer}>Save Answer</button> || (answer.canEdit && <button onClick={this.startEdit}>Edit Answer</button>)}</div>
          <div {...styles.rightButton}>{this.state.editing && <button onClick={this.cancelEdit}>Cancel</button> || (answer.canEdit && <button onClick={this.removeAnswer}>Delete Answer</button>)}</div>
        </div>
        {this.state.imageDialog && <ImageOverlay onClose={this.endImageDialog}/>}
        <div {...styles.comments}>{answer.comments.map(e =>
          <Comment key={e.oid} comment={e} filename={this.props.filename} sectionId={this.props.sectionId} answerId={answer.oid} onSectionChanged={this.props.onSectionChanged}/>
        )}</div>
        {this.state.savedText.length > 0 && <div {...styles.addComment}>
          <div><b>Add comment</b></div>
          <div><MarkdownText value={this.state.commentDraft} /></div>
          <div>
            <textarea {...styles.textareaInput} onChange={this.commentTextareaChange} cols={80} rows={5} value={this.state.commentDraft} />
          </div>
          <div>
            <button onClick={this.addComment} disabled={this.state.commentDraft.length === 0}>Submit Comment</button>
          </div>
        </div>}
      </div>
    );
  }
};
