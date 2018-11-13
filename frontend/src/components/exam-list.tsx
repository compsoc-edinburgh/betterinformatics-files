import * as React from "react";
import {Link} from "react-router-dom";

interface Category {
  name: string;
  exams: string[];
  childCategories?: Category[];
}

interface TempRoots {
  childs: object;
  exams: string[];
}

interface State {
  categories?: Category[];
  rootCategories?: Category[];
}

export default class ExamList extends React.Component<{}, State> {

  state: State = {};

  splitCategory = (category: string) => {
    const first = category.split("/", 1)[0];
    if (first === category) {
      return [first, ""];
    }
    const last = category.substr(first.length+1);
    return [first, last];
  };

  flattenRoots = (roots: TempRoots): Category[] => {
    let res: Category[] = [];
    for (var k in roots.childs){
      if (roots.childs.hasOwnProperty(k)) {
        res.push({
          name: k,
          exams: roots.childs[k].exams,
          childCategories: this.flattenRoots(roots.childs[k])
        });
      }
    }
    return res;
  };

  async componentWillMount() {
    try {
      const res = await (await fetch('/api/listcategories')).json();
      const rawCategories: Category[] = res.value;
      let roots: TempRoots = {childs: {}, exams: []};
      rawCategories.forEach((category) => {
        let curName = category.name;
        let curList = roots.childs;
        while(curName.length > 0) {
          const [first, last] = this.splitCategory(curName);
          if (!curList[first]) {
            curList[first] = {childs: {}, exams: []}
          }
          if (last.length === 0) {
            curList[first].exams.push.apply(curList[first].exams, category.exams);
            break;
          }
          curName = last;
          curList = curList[first].childs;
        }
      });
      this.setState({
        categories: rawCategories,
        rootCategories: this.flattenRoots(roots)
      });
    } catch (e) {
      // TODO implement proper error handling
      console.log(e);
    }
  }

  arrLast = (arr: string[]) => arr[arr.length - 1];

  categoryDisplay = (category: string) => this.arrLast(category.split("/"));

  renderCategory = (category: Category): JSX.Element => {
    return (<ul>
        {category.exams.map(exam => (
          <li key={exam}><Link to={"/exams/" + exam}>{exam}</Link></li>
        ))}
        {category.childCategories &&
        category.childCategories.map(childCat =>
          <li key={childCat.name}>
            {childCat.name}
            {this.renderCategory(childCat)}
          </li>
        )}
      </ul>
    );
  };

  render() {
    const categories = this.state.rootCategories;
    if (!categories) {
      return (<p>Loading exam list...</p>);
    }
    return categories.map(category => (
      <div key={category.name}>
        <h2>{this.categoryDisplay(category.name)}</h2>
        {this.renderCategory(category)}
      </div>
    ));
  }
};
