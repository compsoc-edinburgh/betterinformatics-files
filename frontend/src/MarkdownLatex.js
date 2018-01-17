import Markdown from 'react-remarkable';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class MarkdownLatex extends Component {
  componentDidUpdate(){
    //if(this.props.source.slice(-1)[0] == "$"){ //.slice(-1)[0] gets last element of array
    window.MathJax.Hub.Queue(["Typeset",window.MathJax.Hub,ReactDOM.findDOMNode(this)]);

    //}
  }
  componentDidMount(){
    window.MathJax.Hub.Queue(["Typeset",window.MathJax.Hub,ReactDOM.findDOMNode(this)]);

  }
  render(){
    return <Markdown source={this.props.source.split("$").map((s,count)=>(count%2===1)?s.split('\\').join('\\\\'):s).join("$")}/>;
  }

}

export default MarkdownLatex;
