import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import Latex from "./Latex.js";

class EditComment extends Component {
  /*
  props:
    Answer,submitfunction
  */
  constructor(props){
    super(props);
    this.state = {text: props.text,livepreview:false};
  }
  handleChange(event) {
    this.setState({text: event.target.value,livepreview:this.state.livepreview});
  }
  toggleLivePreview(){
    this.setState({livepreview: !this.state.livepreview,text: this.state.text});
  }
  handleSubmit(event) {
    console.log("SUBMIT");
    event.preventDefault();
    this.props.submitComment(this.state.text);
  }
  render(){
    var livepreview = "";
    if (this.state.livepreview) {
      livepreview = <div className="row"><div className="livepreview col-xs-11 col-xs-offset-1"><Latex source={this.state.text}/></div></div>;
    }
    return(
      <form onSubmit={this.handleSubmit.bind(this)} className="answer">
                <div className="row">
                  <Textarea type="text" className="answertext col-xs-12" value={this.state.text} onChange={this.handleChange.bind(this)} />
                </div>
                <div className="row">
                  <button type="button" onClick={this.toggleLivePreview.bind(this)} className="col-xs-2 col-xs-offset-5">{this.state.livepreview?"Stop Live Preview":"Live Preview"}</button>
                  <input type="submit" className="col-xs-1" value="Fertig"/>
                  <p className="answerauthor col-xs-3">by {this.props["authorId"]}</p>
                </div>
                {livepreview}
    </form>);

  }
}
export default EditComment;
