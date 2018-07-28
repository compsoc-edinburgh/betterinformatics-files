import * as React from "react";
import { Link } from "react-router-dom";

interface Category {
  name: string;
  exams: string[];
}

interface State {
  categories?: Category[];
}

export default class ExamList extends React.Component<{}, State> {

  state: State = {}

  async componentWillMount() {
    try {
      const res = await (await fetch('/api/listcategories')).json();
      this.setState({
        categories: res.value
      });
    } catch (e) {
      // TODO implement proper error handling
      console.log(e);
    }
  }

  render() {
    const categories = this.state.categories;
    if (categories) {
      return categories.map(category => (
        <div key={category.name}>
          <p>{category.name}</p>
          <ul>
            {category.exams.map(exam => (
              <li key={exam}><Link to={"/exams/" + exam}>{ exam }</Link></li>
            ))}
          </ul>
        </div>
      ));
    } else {
      return (<p>Loading exam list...</p>);
    }
  }
};
