import React, { Component } from 'react';

class Voter extends Component {
  constructor(props) {
    super(props);
    //this.state = {clicked:(user.getId() in props.votes)};
  }
  render() {
    if(this.props.enabled){
      return <div className ="voter"><div className={"vote "+(this.props.clicked ? "on" :"")} onClick={this.props.toggleLike}/>{this.props.upvoteCount}</div>;
    }else{
      return <div className ="voter disabled"><div className={"vote "+(this.props.clicked ? "on" :"")}/>{this.props.upvoteCount}</div>;

    }
  }

}
export default Voter;
