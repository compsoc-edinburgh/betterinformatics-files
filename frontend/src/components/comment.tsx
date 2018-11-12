import * as React from "react";
import {Comment} from "../interfaces";
import {css} from "glamor";
import MathText from "./math-text";

interface Props {
  filename: string;
  sectionId: string;
  answerId: string;
  comment: Comment;
}

interface State {
  editing: boolean;
  text: string;
  savedText: string;
}

const styles = {
  wrapper: css({
    border: "1px solid red",
    marginLeft: "15px",
  }),
};

export default class CommentComponent extends React.Component<Props, State> {

  state: State = {
    editing: false,
    savedText: this.props.comment.text,
    text: this.props.comment.text
  };

  render() {
    const {comment} = this.props;
    return (
      <div {...styles.wrapper}>
        <div>
          <b>Comment</b> by {comment.authorId}
        </div>
        <div>Time: {comment.time}</div>
        <div><MathText value={this.state.text}/></div>
      </div>
    );
  }
};