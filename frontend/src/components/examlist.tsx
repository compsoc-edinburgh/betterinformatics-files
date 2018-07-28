import * as React from "react";
import { Link } from "react-router-dom";

interface State {
  exams?: string[]
}

export default class ExamList extends React.Component<{}, State> {

  state: State = {}

  async componentWillMount() {
    try {
      const res = await (await fetch('/api/listexams')).json();
      this.setState({
        exams: res.value
      });
    } catch (e) {
      // TODO implement proper error handling
      console.log(e);
    }
  }

  render() {
    const exams = this.state.exams;
    if (exams) {
      return (
        <ul>
          {exams.map(exam => (
            <li><Link to={"/exams/" + exam}>exam</Link></li>
          ))}
        </ul>
      );
    } else {
      return (<p>Loading exam list...</p>);
    }
  }
};
