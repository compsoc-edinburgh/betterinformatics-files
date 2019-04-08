import * as React from "react";
import {Answer, AnswerSection} from "../interfaces";
import * as moment from 'moment';
import Comment from "./comment";
import {css} from "glamor";
import MarkdownText from "./markdown-text";
import {fetchpost} from '../fetch-utils'
import ImageOverlay from "./image-overlay";
import Colors from "../colors";
import {Link} from "react-router-dom";
import globalcss from "../globalcss";

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
  commentsVisible: boolean;
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
    alignItems: "center"
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
  voteCount: css({
    marginLeft: "9px",
    marginRight: "9px",
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
  textareaInput: css({
    width: "100%",
    resize: "vertical",
    marginTop: "10px",
    marginBottom: "5px",
    padding: "5px",
    boxSizing: "border-box"
  }),
};

export default class AnswerComponent extends React.Component<Props, State> {

  state: State = {
    editing: this.props.answer.canEdit && this.props.answer.text.length === 0,
    imageDialog: false,
    imageCursorPosition: -1,
    savedText: this.props.answer.text,
    text: this.props.answer.text,
    commentsVisible: false,
  };

  setMainDivRef = (element: HTMLDivElement) => {
    this.props.answer.divRef = element;
  };

  removeAnswer = () => {
    const confirmation = confirm("Remove answer?");
    if (confirmation) {
      fetchpost(`/api/exam/${this.props.filename}/removeanswer/${this.props.sectionId}`, this.enrichPostdata({}))
        .then((res) => {
          this.props.onSectionChanged(res);
        })
        .catch(() => undefined);
    }
  };

  enrichPostdata = (postdata: object) => {
    if (this.props.answer.authorId === '__legacy__') {
      return {...postdata, legacyuser: 1};
    } else {
      return postdata;
    }
  };

  saveAnswer = () => {
    fetchpost(`/api/exam/${this.props.filename}/setanswer/${this.props.sectionId}`, this.enrichPostdata({text: this.state.text}))
      .then((res) => {
        this.setState(prevState => ({
          editing: false,
          savedText: prevState.text
        }));
        this.props.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  cancelEdit = () => {
    this.setState(prevState => ({
      editing: false,
      text: prevState.savedText
    }));
  };

  startEdit = () => {
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

  toggleAnswerLike = (like: Number) => {
    const newLike = like === 1 ? (this.props.answer.isUpvoted ? 0 : 1) : (this.props.answer.isDownvoted ? 0 : -1);
    fetchpost(`/api/exam/${this.props.filename}/setlike/${this.props.sectionId}/${this.props.answer.oid}`, {like: newLike})
      .then((res) => {
        this.props.onSectionChanged(res);
      })
      .catch(() => undefined);
  };

  toggleComments = () => {
    this.setState(prevState => ({
      commentsVisible: !prevState.commentsVisible
    }));
  };

  render() {
    const {answer} = this.props;
    return (
      <div {...styles.wrapper}>
        <div ref={this.setMainDivRef} {...styles.header}>
          <div>
              <b {...globalcss.noLinkColor}><Link to={`/user/${answer.authorId}`}>{answer.authorDisplayName}</Link></b> @ {moment(answer.time, "YYYY-MM-DDTHH:mm:ss.SSSSSSZZ").format("DD.MM.YYYY HH:mm")}
          </div>
          <div {...styles.voteWrapper}>
            <div {...styles.voteImgWrapper} onClick={() => this.toggleAnswerLike(-1)} title="Downvote Answer">
              <img {...styles.voteImg} src={"/static/downvote" + (answer.isDownvoted ? "_orange" : "_white") + ".svg"} alt="Downvote" />
            </div>
            <div {...styles.voteCount}>{answer.upvotes}</div>
            <div {...styles.voteImgWrapper} onClick={() => this.toggleAnswerLike(1)} title="Upvote Answer">
              <img {...styles.voteImg} src={"/static/upvote" + (answer.isUpvoted ? "_orange" : "_white") + ".svg"} alt="Upvote" />
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
            {this.state.editing && <button onClick={this.startImageDialog}>Images</button>}
            {!this.state.editing && this.state.savedText.length > 0 &&
              <button onClick={this.toggleComments}>{this.state.commentsVisible ? "Hide" : "Show"} {answer.comments.length} Comments</button>}
          </div>
          <div>
            {this.state.editing && <button onClick={this.saveAnswer}>Save Answer</button> || (answer.canEdit && <button onClick={this.startEdit}>Edit Answer</button>)}
          </div>
          <div {...styles.rightButton}>
            {this.state.editing && <button onClick={this.cancelEdit}>Cancel</button> || (answer.canEdit && <button onClick={this.removeAnswer}>Delete Answer</button>)}
          </div>
        </div>
        {this.state.imageDialog && <ImageOverlay onClose={this.endImageDialog}/>}
        {this.state.commentsVisible &&
        <div {...styles.comments}>
          {answer.comments.map(e =>
            <Comment key={e.oid} comment={e} filename={this.props.filename} sectionId={this.props.sectionId}
                     answerId={answer.oid} onSectionChanged={this.props.onSectionChanged}/>
          )}

          {this.state.savedText.length > 0 &&
          <Comment isNewComment={true}
                   filename={this.props.filename}
                   sectionId={this.props.sectionId}
                   answerId={answer.oid}
                   comment={{oid: "", text: "", authorId: "", authorDisplayName: "", canEdit: true, time: ""}}
                   onSectionChanged={this.props.onSectionChanged}/>}
        </div>
        }
        <div><small><a href={"#" + this.props.answer.oid}>Permalink</a></small></div>
      </div>
    );
  }
};
