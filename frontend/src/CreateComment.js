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
    if(this.state.text.length!==0){
      this.setState({text: "",livepreview:false});
      this.props.submitComment(this.state.text);
    }else {
      alert("you have to write something!");
    }
  }
  render(){
    var livepreview = "";
    if (this.state.livepreview) {
      livepreview = <div className="row col-xs-12 livepreview"><Latex source={this.state.text}/></div>;
    }
    return(
      <form onSubmit={this.handleSubmit.bind(this)} className="answer">
                <div className="row">
                  <Textarea type="text" className="answertext col-xs-12" value={this.state.text} onChange={this.handleChange.bind(this)} />
                </div>
                <div className="row">
                  <p className="col-xs-6">Use $\$$..$\$$ for inline TeX math</p>
                  <button type="button" onClick={this.toggleLivePreview.bind(this)} className="col-xs-3 col-xs-offset-1">{this.state.livepreview?"Stop Live Preview":"Live Preview"}</button>
                  <input type="submit" className="col-xs-2" value="Fertig"/>

                </div>
                {livepreview}
    </form>);

  }
}
export default EditComment;
