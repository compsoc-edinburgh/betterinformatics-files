import * as React from "react";
import {AnswerSection, Comment} from "../interfaces";
import * as moment from 'moment';
import {css} from "glamor";
import MarkdownText from "./markdown-text";
import {fetchpost} from "../fetch-utils";
import ImageOverlay from "./image-overlay";
import {Link} from "react-router-dom";
import globalcss from "../globalcss";
import GlobalConsts from "../globalconsts";

interface Props {
  filename: string;
  sectionId: string;
  answerId: string;
  isNewComment?: boolean;
  comment: Comment;
  onSectionChanged: (res: {value: {answersection: AnswerSection}}) => void;
}

interface State {
  editing: boolean;
  text: string;
  savedText: string;
  imageDialog: boolean;
  imageCursorPosition: number;
}

const styles = {
  wrapper: css({
    marginBottom: "10px"
  }),
  header: css({
    marginBottom: "5px"
  }),
  threebuttons: css({
    textAlign: "center",
    display: "flex",
    justifyContent: "space-between",
    "& > div": {
      width: ["200px", "calc(100% / 3)"]
    }
  }),
  leftButton: css({
    textAlign: "left"
  }),
  rightButton: css({
    textAlign: "right"
  }),
  textareaInput: css({
    width: "100%",
    resize: "vertical",
    marginTop: "10px",
    marginBottom: "5px",
    padding: "5px",
    boxSizing: "border-box"
  }),
};

export default class CommentComponent extends React.Component<Props, State> {

  // noinspection PointlessBooleanExpressionJS
  state: State = {
    editing: !!this.props.isNewComment,
    savedText: this.props.comment.text,
    text: this.props.comment.text,
    imageDialog: false,
    imageCursorPosition: -1,
  };

  removeComment = () => {
    const confirmation = confirm("Remove comment?");
    if (confirmation) {
      fetchpost(`/api/exam/${this.props.filename}/removecomment/${this.props.sectionId}/${this.props.answerId}`, {commentoid: this.props.comment.oid})
        .then((res) => {
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    }
  };

  startEdit = () => {
    this.setState({editing: true});
  };

  cancelEdit = () => {
    this.setState(prevState => ({
      editing: false,
      text: prevState.savedText
    }));
  };

  saveComment = () => {
    if (this.props.isNewComment) {
      fetchpost(`/api/exam/${this.props.filename}/addcomment/${this.props.sectionId}/${this.props.answerId}`, {
        text: this.state.text
      })
        .then((res) => {
          this.setState({text: ""});
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    } else {
      fetchpost(`/api/exam/${this.props.filename}/setcomment/${this.props.sectionId}/${this.props.answerId}`, {
        commentoid: this.props.comment.oid,
        text: this.state.text
      })
        .then((res) => {
          this.setState(prevState => ({
            editing: false,
            savedText: prevState.text
          }));
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    }
  };

  commentTextareaChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    this.setState({
      text: event.currentTarget.value,
      imageCursorPosition: event.currentTarget.selectionStart,
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

  render() {
    const {comment} = this.props;
    return (
      <div {...styles.wrapper}>
        <div {...styles.header}>
          {this.props.isNewComment && <b>Add comment</b>}
            {!this.props.isNewComment && <span><b {...globalcss.noLinkColor}><Link to={`/user/${comment.authorId}`}>{comment.authorDisplayName}</Link></b> @ {moment(comment.time, GlobalConsts.momentParseString).format(GlobalConsts.momentFormatString)}</span>}
        </div>
        <div><MarkdownText value={this.state.editing ? this.state.text : comment.text}/></div>
        {this.state.editing && <div>
          <div>
            <textarea {...styles.textareaInput} onKeyUp={this.commentTextareaChange} onChange={this.commentTextareaChange} cols={80} rows={5} value={this.state.text} />
          </div>
          <div {...styles.threebuttons}>
            <div {...styles.leftButton}>
              {this.state.editing && <button onClick={this.startImageDialog}>Images</button>}
            </div>
            <div><button onClick={this.saveComment}>Save Comment</button></div>
            <div {...styles.rightButton}>{!this.props.isNewComment && <button onClick={this.cancelEdit}>Cancel</button>}</div>
          </div>
        </div>}
        {comment.canEdit && !this.state.editing && <div {...styles.threebuttons}>
          <div {...styles.leftButton}/>
          <div><button onClick={this.startEdit}>Edit Comment</button></div>
          <div {...styles.rightButton}><button onClick={this.removeComment}>Delete Comment</button></div>
        </div>}
        {this.state.imageDialog && <ImageOverlay onClose={this.endImageDialog}/>}
      </div>
    );
  }
};