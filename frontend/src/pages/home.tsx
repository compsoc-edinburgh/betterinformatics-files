import * as React from "react";
import { Link } from "react-router-dom";
import ExamList from "../components/examlist"

interface Props {
  isAdmin?: boolean
}

export default ({ isAdmin }: Props) => (
  <div>
    <h1>VIS Exam Solution Exchange</h1>
    <p>Available exams:</p>
    <ExamList />
    {isAdmin && <p><Link to="/uploadpdf">Upload new exam</Link>.</p>}
  </div>
);
