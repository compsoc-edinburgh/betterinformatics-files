import { fetchUser } from "./userActions"
import { connect } from "react-redux"
import React, { Component } from 'react';
import "./bootstrap/css/bootstrap.min.css";
var Controlpanel = connect((store,props)=>{
  return{
    user: store.user
}})(
class Controlpanel extends React.Component {
  componentWillMount(){
    this.props.dispatch(fetchUser());
  }
  render() {
    return <p>Hello, {this.props.user ? this.props.user.name: "..."}</p>;              
  }
}
);

export default Controlpanel;
