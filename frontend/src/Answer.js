import React, { Component } from 'react';
import Voter from './Voter.js';
import EditAnswer from './EditAnswer.js';
import ReactDOM from 'react-dom';
import MarkdownLatex from './MarkdownLatex.js';
import Comment from "./Comment.js";
import Createcomment from "./CreateComment.js";
import $ from "jquery";

class Answer extends Component {
  componentDidUpdate(){
    window.MathJax.Hub.Queue(["Typeset",window.MathJax.Hub,ReactDOM.findDOMNode(this)]);
  }
  componentDidMount(){
    window.MathJax.Hub.Queue(["Typeset",window.MathJax.Hub,ReactDOM.findDOMNode(this)]);
  }
  render() {
    var comments = this.props.data.comments.map((comm,count)=><Comment text={comm.text} deleteComment={() => this.props.deleteComment(count)} deletable={this.props.userId==comm.authorId || comm.authorId=="me"} authorId={comm.authorId} key={count}/>)
    if (this.props.data.edit !== true){
      return (<div className="answer">
                <div className="row answerrow">
                  <div className="col-xs-1">
                    <Voter enabled={true} upvoteCount={this.props.data["upvotes"].length} clicked={$.inArray(this.props.userId,this.props.data.upvotes)>-1} toggleLike={this.props.toggleLike}/>
                  </div>
                  <div className="col-xs-11 answerfield"><MarkdownLatex source={this.props.data.text}></MarkdownLatex></div>
                </div>
                <div className="row">
                  <p className="author">by {this.props.data["authorId"]}</p>
                  {(this.props.editable)?(<button onClick={this.props.startediting} className="col-xs-1 editbutton">edit
                          <span class="glyphicon glyphicon-pencil"/>
                    </button>):("")}
                </div>
                <div className="row">
                  <div className="col-xs-10 col-xs-offset-2">
                    {comments}
                    <Createcomment className="col-xs-12 row" text="" submitComment={this.props.submitComment}/>

                  </div>

                </div>
              </div>);
    }
    else
      return(
        <EditAnswer data={this.props.data} submitAnswer={this.props.submitAnswer} />
      );
  }
}

export default Answer;
