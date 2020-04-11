import * as React from "react";
import { Answer, AnswerSection } from "../interfaces";
import moment from "moment";
import Comment from "./comment";
import { css } from "glamor";
import MarkdownText from "./markdown-text";
import { fetchPost, imageHandler } from "../fetch-utils";
import Colors from "../colors";
import { Link } from "react-router-dom";
import globalcss from "../globalcss";
import GlobalConsts from "../globalconsts";
import colors from "../colors";
import Editor from "./Editor";
import { UndoStack } from "./Editor/utils/undo-stack";

interface Props {
  isReadonly: boolean;
  isAdmin: boolean;
  isExpert: boolean;
  filename: string;
  sectionId: string;
  answer: Answer;
  onSectionChanged: (res: { value: AnswerSection }) => void;
  onCancelEdit: () => void;
}

interface State {
  editing: boolean;
  imageDialog: boolean;
  text: string;
  undoStack: UndoStack;
  savedText: string;
  addingComment: boolean;
  allCommentsVisible: boolean;
}

const styles = {
  wrapper: css({
    background: Colors.cardBackground,
    padding: "10px",
    marginBottom: "20px",
    boxShadow: Colors.cardShadow,
    "@media (max-width: 699px)": {
      padding: "5px",
    },
  }),
  header: css({
    fontSize: "24px",
    marginBottom: "10px",
    marginLeft: "-10px",
    marginRight: "-10px",
    marginTop: "-10px",
    padding: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: Colors.cardHeader,
    color: Colors.cardHeaderForeground,
    "@media (max-width: 699px)": {
      fontSize: "20px",
      marginLeft: "-5px",
      marginRight: "-5px",
      marginTop: "-5px",
    },
  }),
  voteWrapper: css({
    display: "flex",
    alignItems: "center",
  }),
  voteImgWrapper: css({
    cursor: "pointer",
  }),
  voteImg: css({
    height: "26px",
    marginLeft: "11px",
    marginRight: "11px",
    marginBottom: "-4px", // no idea what's going on...
    "@media (max-width: 699px)": {
      height: "20px",
      marginBottom: "-3px",
    },
  }),
  expertVoteImg: css({
    height: "26px",
    marginLeft: "3px",
    marginRight: "11px",
    marginBottom: "-4px", // no idea what's going on...
    "@media (max-width: 699px)": {
      height: "20px",
      marginBottom: "-3px",
    },
  }),
  voteCount: css({
    marginLeft: "9px",
    marginRight: "9px",
  }),
  expertVoteCount: css({
    marginLeft: "9px",
    marginRight: "3px",
  }),
  answer: css({
    marginTop: "15px",
    marginLeft: "10px",
    marginRight: "10px",
  }),
  answerInput: css({
    marginLeft: "5px",
    marginRight: "5px",
  }),
  answerTexHint: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    marginLeft: "5px",
    marginRight: "5px",
    color: colors.silentText,
  }),
  comments: css({
    marginLeft: "25px",
    marginTop: "10px",
    marginRight: "25px",
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
    width: "100%",
    display: "flex",
    justifyContent: "flex-end",
    marginRight: "25px",
  }),
  actionButton: css({
    cursor: "pointer",
    marginLeft: "10px",
  }),
  actionImg: css({
    height: "26px",
  }),
  permalink: css({
    marginRight: "5px",
    "& a:link, & a:visited": {
      color: Colors.silentText,
    },
    "& a:hover": {
      color: Colors.linkHover,
    },
  }),
  moreComments: css({
    cursor: "pointer",
    color: colors.silentText,
    borderTop: "1px solid " + Colors.commentBorder,
    paddingTop: "2px",
  }),
};

export default class AnswerComponent extends React.Component<Props, State> {
  state: State = {
    editing: this.props.answer.canEdit && this.props.answer.text.length === 0,
    imageDialog: false,
    savedText: this.props.answer.text,
    text: this.props.answer.text,
    allCommentsVisible: false,
    addingComment: false,
    undoStack: { prev: [], next: [] },
  };

  componentDidUpdate(
    prevProps: Readonly<Props>,
    prevState: Readonly<State>,
  ): void {
    if (prevProps.answer.text !== this.props.answer.text) {
      this.setState({
        text: this.props.answer.text,
        savedText: this.props.answer.text,
      });
    }
  }

  setMainDivRef = (element: HTMLDivElement) => {
    this.props.answer.divRef = element;
  };

  removeAnswer = () => {
    // eslint-disable-next-line no-restricted-globals
    const confirmation = confirm("Remove answer?");
    if (confirmation) {
      fetchPost(`/api/exam/removeanswer/${this.props.answer.oid}/`, {})
        .then(res => {
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    }
  };

  saveAnswer = () => {
    fetchPost(`/api/exam/setanswer/${this.props.sectionId}/`, {
      text: this.state.text,
      legacy_answer: this.props.answer.isLegacyAnswer,
    })
      .then(res => {
        this.setState(prevState => ({
          editing: false,
          savedText: prevState.text,
        }));
        this.props.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  cancelEdit = () => {
    this.setState(prevState => ({
      editing: false,
      text: prevState.savedText,
    }));
    this.props.onCancelEdit();
  };

  startEdit = () => {
    this.setState({
      editing: true,
    });
  };

  toggleAddingComment = () => {
    this.setState(prevState => ({
      addingComment: !prevState.addingComment,
    }));
  };

  answerTextareaChange = (newValue: string) => {
    this.setState({
      text: newValue,
    });
  };

  toggleAnswerLike = (like: Number) => {
    const newLike =
      like === 1
        ? this.props.answer.isUpvoted
          ? 0
          : 1
        : this.props.answer.isDownvoted
        ? 0
        : -1;
    fetchPost(`/api/exam/setlike/${this.props.answer.oid}/`, { like: newLike })
      .then(res => {
        this.props.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  toggleAnswerFlag = () => {
    fetchPost(`/api/exam/setflagged/${this.props.answer.oid}/`, {
      flagged: !this.props.answer.isFlagged,
    })
      .then(res => {
        this.props.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  resetAnswerFlagged = () => {
    fetchPost(`/api/exam/resetflagged/${this.props.answer.oid}/`, {})
      .then(res => {
        this.props.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  toggleAnswerExpertVote = () => {
    fetchPost(`/api/exam/setexpertvote/${this.props.answer.oid}/`, {
      vote: !this.props.answer.isExpertVoted,
    })
      .then(res => {
        this.props.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  toggleComments = () => {
    this.setState(prevState => ({
      allCommentsVisible: !prevState.allCommentsVisible,
    }));
  };

  copyPermalink = (answer: Answer) => {
    const textarea = document.createElement("textarea");
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.background = 'transparent';
    textarea.value = window.location.href.split('#')[0] + "#" + answer.longId;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  render() {
    const { answer } = this.props;
    let comments = answer.comments;
    const commentLimit = this.props.isReadonly ? 0 : 3;
    if (!this.state.allCommentsVisible && comments.length > commentLimit) {
      comments = comments.slice(0, commentLimit);
    }
    return (
      <div {...styles.wrapper}>
        <div ref={this.setMainDivRef} {...styles.header}>
          <div>
            <b {...globalcss.noLinkColor}>
              {(answer.authorId.length > 0 && (
                <Link to={`/user/${answer.authorId}`}>
                  {answer.authorDisplayName}
                </Link>
              )) || <span>{answer.authorDisplayName}</span>}
            </b>{" "}
            •{" "}
            {moment(answer.time, GlobalConsts.momentParseString).format(
              GlobalConsts.momentFormatString,
            )}
          </div>
          {this.props.answer.oid.length > 0 && (
            <div {...styles.voteWrapper}>
              {!this.props.isReadonly &&
                this.props.isExpert && [
                  <div {...styles.expertVoteCount}>{answer.expertvotes}</div>,
                  <div
                    {...styles.voteImgWrapper}
                    onClick={this.toggleAnswerExpertVote}
                    title="Endorse Answer"
                  >
                    <img
                      {...styles.expertVoteImg}
                      src={
                        "/static/expert" +
                        (answer.isExpertVoted ? "_active" : "") +
                        ".svg"
                      }
                      alt="Endorse Answer"
                    />
                  </div>,
                ]}
              {(this.props.isReadonly || !this.props.isExpert) &&
                answer.expertvotes > 0 && [
                  answer.expertvotes > 1 && (
                    <div {...styles.expertVoteCount}>{answer.expertvotes}</div>
                  ),
                  <div>
                    <img
                      {...styles.expertVoteImg}
                      src="/static/expert_active.svg"
                      title={
                        "Expert Endorsed" +
                        (answer.expertvotes > 1
                          ? " (" + answer.expertvotes + " votes)"
                          : "")
                      }
                      alt="This answer is endorsed by an expert"
                    />
                  </div>,
                ]}
              {!this.props.isReadonly && (
                <div
                  {...styles.voteImgWrapper}
                  onClick={() => this.toggleAnswerLike(-1)}
                  title="Downvote Answer"
                >
                  <img
                    {...styles.voteImg}
                    src={
                      "/static/downvote" +
                      (answer.isDownvoted ? "_orange" : "_white") +
                      ".svg"
                    }
                    alt="Downvote"
                  />
                </div>
              )}
              <div {...styles.voteCount}>{answer.upvotes}</div>
              {!this.props.isReadonly && (
                <div
                  {...styles.voteImgWrapper}
                  onClick={() => this.toggleAnswerLike(1)}
                  title="Upvote Answer"
                >
                  <img
                    {...styles.voteImg}
                    src={
                      "/static/upvote" +
                      (answer.isUpvoted ? "_orange" : "_white") +
                      ".svg"
                    }
                    alt="Upvote"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {!this.state.editing && (
          <div {...styles.answer}>
            <MarkdownText value={this.state.text} />
          </div>
        )}
        {this.state.editing && (
          <div>
            <div {...styles.answerInput}>
              <Editor
                value={this.state.text}
                onChange={this.answerTextareaChange}
                imageHandler={imageHandler}
                preview={str => <MarkdownText value={str} />}
                undoStack={this.state.undoStack}
                setUndoStack={undoStack => this.setState({ undoStack })}
              />
            </div>
            <div {...styles.answerTexHint}>
              <div {...styles.actionButtons}>
                <div {...styles.actionButton} onClick={this.saveAnswer}>
                  <img
                    {...styles.actionImg}
                    src="/static/save.svg"
                    title="Save"
                    alt="Save"
                  />
                </div>
                <div {...styles.actionButton} onClick={this.cancelEdit}>
                  <img
                    {...styles.actionImg}
                    src="/static/cancel.svg"
                    title="Cancel"
                    alt="Cancel"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!this.state.editing && (
          <div {...styles.actionButtons}>
            <div {...styles.permalink}>
              <small>
                <Link
                  onClick={() => this.copyPermalink(answer)}
                  to={"/exams/" + this.props.filename + "#" + answer.longId}
                  title="Copy link to clipboard"
                >
                  Permalink
                </Link>
              </small>
            </div>
            {!this.props.isReadonly && this.state.savedText.length > 0 && (
              <div {...styles.actionButton} onClick={this.toggleAddingComment}>
                <img
                  {...styles.actionImg}
                  src="/static/comment.svg"
                  title="Add Comment"
                  alt="Add Comment"
                />
              </div>
            )}
            {!this.props.isReadonly && answer.canEdit && (
              <div {...styles.actionButton} onClick={this.startEdit}>
                <img
                  {...styles.actionImg}
                  src="/static/edit.svg"
                  title="Edit Answer"
                  alt="Edit Answer"
                />
              </div>
            )}
            {!this.props.isReadonly && (answer.canEdit || this.props.isAdmin) && (
              <div {...styles.actionButton} onClick={this.removeAnswer}>
                <img
                  {...styles.actionImg}
                  src="/static/delete.svg"
                  title="Delete Answer"
                  alt="Delete Answer"
                />
              </div>
            )}
            {!this.props.isReadonly && (
              <div {...styles.actionButton} onClick={this.toggleAnswerFlag}>
                <img
                  {...styles.actionImg}
                  src={
                    answer.isFlagged
                      ? "/static/flag_active.svg"
                      : "/static/flag.svg"
                  }
                  title="Flag as Inappropriate"
                  alt="Flag as Inappropriate"
                />
              </div>
            )}
            {!this.props.isReadonly && answer.flagged > 0 && (
              <div {...styles.actionButton} onClick={this.resetAnswerFlagged}>
                {answer.flagged}
              </div>
            )}
          </div>
        )}

        {(answer.comments.length > 0 || this.state.addingComment) && (
          <div {...styles.comments}>
            {this.state.addingComment && (
              <Comment
                isNewComment={true}
                isReadonly={this.props.isReadonly}
                isAdmin={this.props.isAdmin}
                sectionId={this.props.sectionId}
                answerId={answer.oid}
                comment={{
                  oid: "",
                  longId: "",
                  text: "",
                  authorId: "",
                  authorDisplayName: "",
                  canEdit: true,
                  time: "",
                  edittime: "",
                }}
                onSectionChanged={this.props.onSectionChanged}
                onNewCommentSaved={this.toggleAddingComment}
              />
            )}
            {comments.map(e => (
              <Comment
                key={e.oid}
                isReadonly={this.props.isReadonly}
                isAdmin={this.props.isAdmin}
                comment={e}
                sectionId={this.props.sectionId}
                answerId={answer.oid}
                onSectionChanged={this.props.onSectionChanged}
              />
            ))}
            {comments.length < answer.comments.length && (
              <div {...styles.moreComments} onClick={this.toggleComments}>
                Show {answer.comments.length - comments.length} more comments...
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
