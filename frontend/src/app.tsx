import * as React from "react";
import Exam from "./pages/exam";
import Home from "./pages/home";
import { Route, Switch } from "react-router";
import Header from "./components/header";
import { css } from "glamor";

const styles = {
  inner: css({
    padding: "15px",
  }),
};

export default () => (
  <div>
    <Header username="Fake User" />
    <div {...styles.inner}>
      <Switch>
        <Route path="/exams/fake" component={Exam} />
        <Route component={Home} />
      </Switch>
    </div>
  </div>
);
