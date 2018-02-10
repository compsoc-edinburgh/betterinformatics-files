import React, { Component } from 'react';
import { connect } from "react-redux"
import Answer from "./Answer.js"
import { fetchUser } from "./userActions"
import { fetchAnswers,wantToggleLike,wantToSetAnswer,startEdit,wantAddComment,newAnswer,addAnswersection,wantRemoveAnswersection,wantDeleteComment} from "./answersActions"
import "./bootstrap/css/bootstrap.min.css";

var Answersection = connect((store,props)=>{
  return{
    user: store.user,
    answersection:(props.pageNum+"" in store.answers && props.relHeight+"" in store.answers[props.pageNum+""])? store.answers[props.pageNum+""][props.relHeight+""]:null,}
})(
class Answersection extends Component {
  constructor(props){
    super(props);
    this.state = {makeNew:props.makeNew};
  }
  toggleLikeOf(answerIndex){
    if(this.props !== null && this.props.user !== null){
      this.props.dispatch(wantToggleLike(this.props.pageNum,this.props.relHeight,answerIndex,this.props.user.id));
    }
  }
  startEditingOf(answerIndex){
    this.props.dispatch(startEdit(this.props.pageNum,this.props.relHeight,answerIndex));
  }
  deleteCommentOf(answerIndex,commentIndex){
    console.log("Type of deleteComment:"+ typeof deleteComment);
    this.props.dispatch(wantDeleteComment(this.props.pageNum,this.props.relHeight,answerIndex,commentIndex));
  }
  componentWillMount(){
    this.props.dispatch(fetchUser());
    if(this.state.makeNew){
      this.props.dispatch(addAnswersection(this.props.pageNum,this.props.relHeight));
      this.setState({makeNew:false});
    }else{
      this.props.dispatch(fetchAnswers(this.props.pageNum,this.props.relHeight,this.props._id));
    }
  }
  removeThis(){
    this.props.dispatch(wantRemoveAnswersection(this.props.pageNum,this.props.relHeight));
  }
  render() {
    if(this.props.answersection !== null && this.props.answersection !== undefined && this.props.user !== null && this.props.user !== undefined){
      if(this.props.answersection !== undefined && this.props.answersection.removed == true){
        return <p className="removedtag">REMOVED</p>
      }else{
        var cutdata = this.props.answersection;
        var answers = cutdata["answers"];
        var userId = this.props.user.id;
        if(answers){
            answers = answers.sort((a,b)=>b.upvotes.length-a.upvotes.length);
        }else{
            answers = [];
        }
        var answerElements = answers.map(
          (answer,count)=>{
            return <Answer startediting={()=>this.startEditingOf(count)} deleteComment={(commCount)=>this.deleteCommentOf(count,commCount)} editable={answer.authorId===userId || answer.authorId==="me"} key={count} index={count} data={answer} userId={userId} submitComment={(text)=>this.props.dispatch(wantAddComment(this.props.pageNum,this.props.relHeight,count,text))} submitAnswer={(text) => {return this.props.dispatch(wantToSetAnswer(this.props.pageNum,this.props.relHeight,count,text));} } toggleLike={()=>{this.toggleLikeOf(count)}}/>});
        return (
          <div className="answerlist container-fluid">
            <div className="row">
              {(userId==cutdata.asker || "me"==cutdata.asker)?<button className="col-xs-2 col-xs-offset-7" onClick={this.removeThis.bind(this)}>Remove</button>:""}
              <p className="author">Marked by {cutdata["asker"]}</p>
            </div>
            {answerElements}
            <div className="row"><button onClick={()=>this.props.dispatch(newAnswer(this.props.pageNum,this.props.relHeight))} className="col-xs-12 addanswer">Add Answer</button></div>
          </div>
        );
      }

    }else{
      return (<p>Loading</p>);
    }
  }
})

export default Answersection;
