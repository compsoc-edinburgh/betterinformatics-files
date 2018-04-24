import * as React from "react";
import Exam from "./pages/exam";
import Home from "./pages/home";
import { Route, Switch } from "react-router";

export default () => (
  <div>
    <Switch>
      <Route path="/exams/fake" component={Exam} />
      <Route component={Home} />
    </Switch>
  </div>
);
