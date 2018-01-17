import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Latex from './Latex.js';
import EditComment from './EditComment.js';

class Comment extends Component {
  render(){
      return(
        <div className="container-fluid">
          <div className="row">
            <Latex source={this.props.text}/>
          </div>
          <div className="row">
            {(this.props.deletable)?(<button onClick={this.props.deleteComment} className="col-xs-1 col-xs-offset-7">delete</button>):("")}
            <p className="answerauthor col-xs-3">by {this.props.authorId}</p>
          </div>

        </div>);
    
  }
}

export default Comment;
