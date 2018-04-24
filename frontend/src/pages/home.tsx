import * as React from "react";
import { Link } from "react-router-dom";

export default () => (
  <div>
    This is the home page. <br />
    See the <Link to="/exams/fake">fake exam</Link>.
  </div>
);
