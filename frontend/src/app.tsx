import * as React from "react";
import Exam from "./pages/exam";
import UploadPDF from "./pages/uploadpdf";
import Categorize from "./pages/categorize";
import Home from "./pages/home";
import {Route, Switch} from "react-router";
import Header from "./components/header";
import {css} from "glamor";

const styles = {
  everything: css({
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    "& h1": {
      marginBlockStart: "0.4em",
      marginBlockEnd: "0.4em"
    },
    "& h2": {
      marginBlockStart: "0.3em",
      marginBlockEnd: "0.3em"
    },
    '& a': {
      textDecoration: 'none',
      ':link': {
        color: '#4b41ff'
      },
      ':visited': {
        color: '#4b41ff'
      },
      ':hover': {
        color: '#ff6130'
      }
    },
    "& button": {
      cursor: "pointer",
      background: "#cccccc",
      padding: "10px 20px",
      border: "none",
      color: "black",
      textAlign: "center",
      textDecoration: "none",
      display: "inline-block",
      borderRadius: "5px",
      margin: "5px"
    },
    "& input": {
      margin: "5px",
      padding: "10px",
      border: "0.5px solid #cccccc",
      borderRadius: "2px",
      boxSizing: "border-box"
    },
    "& button[disabled]": {
      background: "#888888"
    },
    "& button:hover": {
      background: "#aaaaaa"
    },
    "& button[disabled]:hover": {
      cursor: "not-allowed"
    },
    "& .primary": {
      background: "#8cd6ff",
      ":hover": {
        background: "#3980ff"
      }
    }
  }),
  inner: css({
    padding: "15px",
  }),
};

interface State {
  username: string;
  displayname: string;
  isAdmin: boolean;
  isCategoryAdmin: boolean;
}

export default class App extends React.Component<{}, State> {

  state: State = {
    username: "",
    displayname: "",
    isAdmin: false,
    isCategoryAdmin: false,
  };

  async componentWillMount() {
    fetch("/api/user")
      .then(res => res.json())
      .then(res => this.setState({
        username: res.username,
        displayname: res.displayname,
        isAdmin: res.adminrights,
        isCategoryAdmin: res.adminrightscat,
      }))
      .catch(()=>undefined);
  }

  render() {
    return (
      <div {...styles.everything}>
        <Header username={this.state.displayname || "loading..."}/>
        <div {...styles.inner}>
          <Switch>
            <Route path="/exams/:filename" render={(props) => (
              <Exam {...props} filename={props.match.params.filename}/>)}/>
            <Route path="/uploadpdf" component={UploadPDF}/>
            <Route path="/categorize" render={(props) => (<Categorize {...props} isAdmin={this.state.isAdmin}/>)}/>
            <Route render={(props) => (<Home {...props} isAdmin={this.state.isAdmin} isCategoryAdmin={this.state.isCategoryAdmin}/>)}/>
          </Switch>
        </div>
      </div>
    )
  }
};
