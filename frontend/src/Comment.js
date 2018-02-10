import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Latex from './Latex.js';
import EditComment from './EditComment.js';

class Comment extends Component {
  render(){
      return(
        <div className="comment container-fluid">
          <div className="row">
            <Latex source={this.props.text}/>
          </div>
          <div className="row">
            <p className="author">by {this.props.authorId}</p>
            {(this.props.deletable)?(<button onClick={this.props.deleteComment} className="col-xs-2 deletebutton">delete</button>):("")}
          </div>

        </div>);
    
  }
}

export default Comment;
