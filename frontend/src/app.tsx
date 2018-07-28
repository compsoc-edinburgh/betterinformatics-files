import * as React from "react";
import Exam from "./pages/exam";
import UploadPDF from "./pages/uploadpdf";
import Categorize from "./pages/categorize";
import Home from "./pages/home";
import { Route, Switch } from "react-router";
import Header from "./components/header";
import { css } from "glamor";

const styles = {
  inner: css({
    padding: "15px",
  }),
};

interface State {
  username: string;
  displayname: string;
  isAdmin: boolean;
}

export default class App extends React.Component<{}, State> {

  state: State = {
    username: "",
    displayname: "",
    isAdmin: false,
  };

  async componentWillMount() {
    try {
      const res = await (await fetch("/api/user")).json();
      this.setState({
        username: res.username,
        displayname: res.displayname,
        isAdmin: res.adminrights,
      });
    } catch (e) {
      this.setState({displayname: "error"});
      // TODO implement proper error handling
      console.log(e);
    }
  }

  render() {
    return (
      <div>
        <Header username={this.state.displayname ? this.state.displayname : "loading..."} />
        <div {...styles.inner}>
          <Switch>
            <Route path="/exams/:filename" render={(props) => (<Exam {...props} filename={props.match.params.filename} isAdmin={this.state.isAdmin} />)} />
            <Route path="/uploadpdf" component={UploadPDF} />
            <Route path="/categorize" component={Categorize} />
            <Route render={(props) => (<Home {...props} isAdmin={this.state.isAdmin} />)} />
          </Switch>
        </div>
      </div>
    )
  }
};
