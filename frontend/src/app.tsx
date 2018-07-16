import * as React from "react";
import Exam from "./pages/exam";
import UploadPDF from "./pages/uploadpdf";
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
    username: "loading...",
    displayname: "loading...",
    isAdmin: false,
  };

  async componentWillMount() {
    fetch("/api/user")
      .then(res => res.json())
      .then(
        (res) => {
          this.setState({
            username: res.username,
            displayname: res.displayname,
            isAdmin: res.adminrights,
          });
        },
        (error) => {
          this.setState({displayname: "error"});
          console.log(error);
        }
      );
  }

  render() {
    return (
      <div>
        <Header username={this.state.displayname} />
        <div {...styles.inner}>
          <Switch>
            <Route path="/exams/fake" component={Exam} />
            <Route path="/uploadpdf" component={UploadPDF} />
            <Route render={(props) => (<Home isAdmin={this.state.isAdmin} />)} />
          </Switch>
        </div>
      </div>
    )
  }
};
