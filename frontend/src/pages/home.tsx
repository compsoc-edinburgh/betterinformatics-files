import * as React from "react";
import { Link } from "react-router-dom";
import ExamList from "../components/exam-list"

interface Props {
  isAdmin?: boolean;
}

export default class Home extends React.Component<Props> {

  async componentDidMount() {
    document.title = "VIS-Exchange";
  }

  render() {
    return (
      <div>
      <h1>VIS Exam Solution Exchange</h1>
      <p>Available exams:</p>
      <ExamList />
      {this.props.isAdmin && <p><Link to="/uploadpdf">Upload new exam</Link>.</p>}
      {this.props.isAdmin && <p><Link to="/categorize">Categorize exams</Link>.</p>}
      </div>
    );
  }
};
