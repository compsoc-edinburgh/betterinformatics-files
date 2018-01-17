import React, { Component } from 'react';
import Voter from "./Voter.js";
import Textarea from 'react-textarea-autosize';
import MarkdownLatex from "./MarkdownLatex.js";
import Alert from 'react-s-alert';
import 'react-s-alert/dist/s-alert-default.css';

class EditAnswer extends Component {
  /*
  props:
    Answer,submitfunction
  */
  constructor(props){
    super(props);
    this.state = {text: props.data.text,livepreview:false};
  }
  handleChange(event) {
    this.setState({text: event.target.value,livepreview:this.state.livepreview});
    if(this.state.livepreview){

    }
  }
  toggleLivePreview(){
    this.setState({livepreview: !this.state.livepreview,text: this.state.text});
  }
  handleSubmit(event) {
    console.log("SUBMIT");
    event.preventDefault();
    if(this.state.text.length!==0){
      this.props.submitAnswer(this.state.text);
    }else {
      alert("yo have to write something!");
    }
  }
  render(){
    var livepreview = "";
    if (this.state.livepreview) {
      livepreview = <div className="row"><div className="livepreview col-xs-11 col-xs-offset-1"><MarkdownLatex source={this.state.text}/></div></div>;
    }
    return(
      <form onSubmit={this.handleSubmit.bind(this)} className="answer">
                <div className="row">
                  <div className="col-xs-1">
                    <Voter enabled={false} upvoteCount={this.props.data["upvotes"].size} clicked={this.props.data.upvotes.indexOf(this.props.userId)>-1} toggleLike={this.props.toggleLike}/>
                  </div>
                  <Textarea type="text" className="answertext col-xs-11" value={this.state.text} onChange={this.handleChange.bind(this)} />
                </div>
                <div className="row">
                  <p className="col-xs-5">Use Markdown Syntax and $\$...\$$ for inline TeX math</p>
                  <button type="button" onClick={this.toggleLivePreview.bind(this)} className="col-xs-2">{this.state.livepreview?"Stop Live Preview":"Live Preview"}</button>
                  <input type="submit" className="col-xs-1" value="Fertig"/>
                  <p className="answerauthor col-xs-3">by {this.props.data["authorId"]}</p>
                </div>
                {livepreview}
    </form>);

  }
}
export default EditAnswer;
