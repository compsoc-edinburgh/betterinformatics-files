import * as React from "react";
import { AnswerSection, Comment } from "../interfaces";
import * as moment from "moment";
import { css } from "glamor";
import MarkdownText from "./markdown-text";
import { fetchpost } from "../fetch-utils";
import ImageOverlay from "./image-overlay";
import { Link } from "react-router-dom";
import globalcss from "../globalcss";
import GlobalConsts from "../globalconsts";
import { listenEnter } from "../input-utils";
import Colors from "../colors";

interface Props {
  isReadonly: boolean;
  isAdmin: boolean;
  filename: string;
  sectionId: string;
  answerId: string;
  isNewComment?: boolean;
  comment: Comment;
  onSectionChanged: (res: { value: { answersection: AnswerSection } }) => void;
  onNewCommentSaved?: () => void;
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
    marginBottom: "5px",
    borderTop: "1px solid " + Colors.commentBorder,
    paddingTop: "5px",
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    color: Colors.silentText,
  }),
  comment: css({
    marginTop: "2px",
    marginBottom: "7px",
  }),
  textareaInput: css({
    width: "100%",
    resize: "vertical",
    marginTop: "10px",
    marginBottom: "5px",
    padding: "5px",
    boxSizing: "border-box",
  }),
  actionButtons: css({
    display: "flex",
    justifyContent: "flex-end",
  }),
  actionButton: css({
    cursor: "pointer",
    marginLeft: "10px",
  }),
  actionImg: css({
    height: "26px",
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
      fetchpost(
        `/api/exam/${this.props.filename}/removecomment/${this.props.sectionId}/${this.props.answerId}`,
        {
          commentoid: this.props.comment.oid,
          admin: !this.props.comment.canEdit && this.props.isAdmin ? 1 : 0,
        },
      )
        .then(res => {
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    }
  };

  startEdit = () => {
    this.setState({ editing: true });
  };

  cancelEdit = () => {
    this.setState(prevState => ({
      editing: false,
      text: prevState.savedText,
    }));
  };

  saveComment = () => {
    if (this.props.isNewComment) {
      fetchpost(
        `/api/exam/${this.props.filename}/addcomment/${this.props.sectionId}/${this.props.answerId}`,
        {
          text: this.state.text,
        },
      )
        .then(res => {
          this.setState({ text: "" });
          if (this.props.onNewCommentSaved) {
            this.props.onNewCommentSaved();
          }
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    } else {
      fetchpost(
        `/api/exam/${this.props.filename}/setcomment/${this.props.sectionId}/${this.props.answerId}`,
        {
          commentoid: this.props.comment.oid,
          text: this.state.text,
        },
      )
        .then(res => {
          this.setState(prevState => ({
            editing: false,
            savedText: prevState.text,
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
    this.setState({ imageDialog: true });
  };

  endImageDialog = (image: string) => {
    if (image.length > 0) {
      const imageTag = `![Image Description](${image})`;
      this.setState(prevState => ({
        imageDialog: false,
        text:
          prevState.text.slice(0, prevState.imageCursorPosition) +
          imageTag +
          prevState.text.slice(prevState.imageCursorPosition),
      }));
    } else {
      this.setState({ imageDialog: false });
    }
  };

  render() {
    const { comment } = this.props;
    return (
      <div {...styles.wrapper}>
        <div {...styles.header}>
          <div>
            {this.props.isNewComment && <b>Add comment</b>}
            {!this.props.isNewComment && (
              <span>
                <b {...globalcss.noLinkColor}>
                  <Link to={`/user/${comment.authorId}`}>
                    {comment.authorDisplayName}
                  </Link>
                </b>{" "}
                •{" "}
                {moment(comment.time, GlobalConsts.momentParseString).format(
                  GlobalConsts.momentFormatString,
                )}
              </span>
            )}
          </div>
          <div {...styles.actionButtons}>
            {!this.props.isReadonly && comment.canEdit && !this.state.editing && (
              <div {...styles.actionButton} onClick={this.startEdit}>
                <img
                  {...styles.actionImg}
                  src="/static/edit.svg"
                  title="Edit Comment"
                />
              </div>
            )}
            {!this.props.isReadonly &&
              (comment.canEdit || this.props.isAdmin) &&
              !this.state.editing && (
                <div {...styles.actionButton} onClick={this.removeComment}>
                  <img
                    {...styles.actionImg}
                    src="/static/delete.svg"
                    title="Delete Comment"
                  />
                </div>
              )}
          </div>
        </div>
        <div {...styles.comment}>
          <MarkdownText
            value={this.state.editing ? this.state.text : comment.text}
          />
        </div>
        {this.state.editing && (
          <div>
            <div>
              <textarea
                {...styles.textareaInput}
                onKeyUp={this.commentTextareaChange}
                onChange={this.commentTextareaChange}
                cols={80}
                rows={5}
                value={this.state.text}
                onKeyPress={listenEnter(this.saveComment, true)}
              />
            </div>
            <div {...styles.actionButtons}>
              <div {...styles.actionButton} onClick={this.startImageDialog}>
                <img
                  {...styles.actionImg}
                  src="/static/images.svg"
                  title="Images"
                />
              </div>
              <div {...styles.actionButton} onClick={this.saveComment}>
                <img
                  {...styles.actionImg}
                  src="/static/save.svg"
                  title="Save Comment"
                />
              </div>
              {!this.props.isNewComment && (
                <div {...styles.actionButton} onClick={this.cancelEdit}>
                  <img
                    {...styles.actionImg}
                    src="/static/cancel.svg"
                    title="Cancel"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {this.state.imageDialog && (
          <ImageOverlay onClose={this.endImageDialog} />
        )}
      </div>
    );
  }
}
