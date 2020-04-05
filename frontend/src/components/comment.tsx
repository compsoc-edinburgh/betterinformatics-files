import * as React from "react";
import { AnswerSection, Comment } from "../interfaces";
import moment from "moment";
import { css } from "glamor";
import MarkdownText from "./markdown-text";
import { fetchPost, imageHandler } from "../fetch-utils";
import { Link } from "react-router-dom";
import globalcss from "../globalcss";
import GlobalConsts from "../globalconsts";
import Colors from "../colors";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";

interface Props {
  isReadonly: boolean;
  isAdmin: boolean;
  sectionId: string;
  answerId: string;
  isNewComment?: boolean;
  comment: Comment;
  onSectionChanged: (res: { value: AnswerSection }) => void;
  onNewCommentSaved?: () => void;
}

interface State {
  editing: boolean;
  text: string;
  savedText: string;
  undoStack: UndoStack;
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
    undoStack: { prev: [], next: [] },
  };

  removeComment = () => {
    // eslint-disable-next-line no-restricted-globals
    const confirmation = confirm("Remove comment?");
    if (confirmation) {
      fetchPost(`/api/exam/removecomment/${this.props.comment.oid}/`, {})
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
      fetchPost(`/api/exam/addcomment/${this.props.answerId}/`, {
        text: this.state.text,
      })
        .then(res => {
          this.setState({ text: "" });
          if (this.props.onNewCommentSaved) {
            this.props.onNewCommentSaved();
          }
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    } else {
      fetchPost(`/api/exam/setcomment/${this.props.comment.oid}/`, {
        text: this.state.text,
      })
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

  commentTextareaChange = (newValue: string) => {
    this.setState({
      text: newValue,
    });
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
                  alt="Edit Comment"
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
                    alt="Delete Comment"
                  />
                </div>
              )}
          </div>
        </div>
        {!this.state.editing && (
          <div {...styles.comment}>
            <MarkdownText
              value={this.state.editing ? this.state.text : comment.text}
            />
          </div>
        )}
        {this.state.editing && (
          <div>
            <div>
              <Editor
                value={this.state.text}
                onChange={this.commentTextareaChange}
                imageHandler={imageHandler}
                preview={str => <MarkdownText value={str} />}
                undoStack={this.state.undoStack}
                setUndoStack={undoStack => this.setState({ undoStack })}
              />
            </div>
            <div {...styles.actionButtons}>
              <div {...styles.actionButton} onClick={this.saveComment}>
                <img
                  {...styles.actionImg}
                  src="/static/save.svg"
                  title="Save Comment"
                  alt="Save Comment"
                />
              </div>
              {!this.props.isNewComment && (
                <div {...styles.actionButton} onClick={this.cancelEdit}>
                  <img
                    {...styles.actionImg}
                    src="/static/cancel.svg"
                    title="Cancel"
                    alt="Cancel"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
