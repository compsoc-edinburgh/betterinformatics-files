import * as React from "react";
import Exam from "./pages/exam";
import UploadPDF from "./pages/uploadpdf";
import Categorize from "./pages/categorize";
import Home from "./pages/home";
import {Route, Switch} from "react-router";
import Header from "./components/header";
import {css} from "glamor";
import Feedback from "./pages/feedback";
import Colors from "./colors";
import {fetchapi} from "./fetch-utils";
import UserInfo from "./pages/userinfo";

css.global('body', {
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
});
css.global('h1', {
  marginBlockStart: "0.4em",
  marginBlockEnd: "0.4em"
});
css.global('h2', {
  marginBlockStart: "0.3em",
  marginBlockEnd: "0.3em"
});
css.global('a', {
  textDecoration: 'none',
});
css.global('a:link', {
  color: Colors.link
});
css.global('a:visited', {
  color: Colors.linkVisited
});
css.global('a:hover', {
  color: Colors.linkHover
});
css.global('button', {
  cursor: "pointer",
  background: Colors.buttonBackground,
  padding: "7px 14px",
  border: "none",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  borderRadius: "5px",
  margin: "5px"
});
css.global('input', {
  margin: "5px",
  padding: "7px",
  border: "0.5px solid #cccccc",
  borderRadius: "2px",
  boxSizing: "border-box"
});
css.global('button[disabled]', {
  background: Colors.buttonBackgroundDisabled
});
css.global('button:hover', {
  background: Colors.buttonBackgroundHover
});
css.global('button[disabled]:hover', {
  cursor: "not-allowed"
});
css.global('.primary', {
  background: Colors.buttonPrimary,
});
css.global('.primary:hover', {
  background: Colors.buttonPrimaryHover,
});
css.global('table', {
  borderCollapse: 'collapse',
});
css.global('table td, table th', {
  border: '2px solid ' + Colors.tableBorder,
  padding: '8px',
});
css.global('table th', {
  background: Colors.tableHeader,
});
css.global('table tr:nth-child(even)', {
  background: Colors.tableEven,
});
css.global('table tr:nth-child(odd)', {
  background: Colors.tableOdd,
});

const styles = {
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
    fetchapi("/api/me")
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
      <div>
        <Header username={this.state.username} displayName={this.state.displayname || "loading..."}/>
        <div {...styles.inner}>
          <Switch>
            <Route path="/exams/:filename" render={(props) => (
              <Exam {...props} filename={props.match.params.filename}/>)}/>
            <Route path="/user/:username" render={(props) => (
                <UserInfo {...props} username={props.match.params.username}/>)}/>
            <Route path="/uploadpdf" component={UploadPDF}/>
            <Route path="/categorize" render={(props) => (<Categorize {...props} isAdmin={this.state.isAdmin}/>)}/>
            <Route path="/feedback" render={(props) => (<Feedback {...props} isAdmin={this.state.isAdmin}/>)} />
            <Route render={(props) => (<Home {...props} isAdmin={this.state.isAdmin} isCategoryAdmin={this.state.isCategoryAdmin}/>)}/>
          </Switch>
        </div>
      </div>
    )
  }
};
