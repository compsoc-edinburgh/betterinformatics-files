import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class Latex extends Component {
  componentDidUpdate(){
    //if(this.props.source.slice(-1)[0] == "$"){ //.slice(-1)[0] gets last element of array
    window.MathJax.Hub.Queue(["Typeset",window.MathJax.Hub,ReactDOM.findDOMNode(this)]);
    //}
  }
  componentDidMount(){
    window.MathJax.Hub.Queue(["Typeset",window.MathJax.Hub,ReactDOM.findDOMNode(this)]);

  }
  render(){
    return <p>{this.props.source.split("\n").map((s,count)=> <span key={count}>{s}<br/></span>)}</p>;
  }

}

export default Latex;
