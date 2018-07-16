import * as React from "react";
import { Link } from "react-router-dom";

interface Props {
  isAdmin?: boolean
}

export default ({ isAdmin }: Props) => (
  <div>
    <p>This is the home page.</p>
    <p>See the <Link to="/exams/fake">fake exam</Link>.</p>
    {isAdmin && <p><Link to="/uploadpdf">Upload new exam</Link>.</p>}
  </div>
);
