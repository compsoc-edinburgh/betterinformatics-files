import * as React from "react";
import {Link} from "react-router-dom";
import {css} from "glamor";

const styles = {
  wrapper: css({
    width: "100%",
    display: "flex",
    flexWrap: "wrap"
  }),
  category: css({
    background: "#eeeeee",
    width: "250px",
    paddingLeft: "10px",
    paddingRight: "10px",
    paddingBottom: "20px",
    marginLeft: "20px",
    marginRight: "20px",
    marginBottom: "40px",
    borderRadius: "0px",
    boxShadow: "0 4px 8px 0 grey"
  }),
  subtitle: css({
    textTransform: "capitalize",
    fontWeight: "bold"
  }),
  subtitles: [
    css({
      paddingLeft: "15px",
      fontSize: "24px"
    }),
    css({
      paddingLeft: "25px",
      fontSize: "18px"
    }),
    css({
      paddingLeft: "35px"
    }),
    css({
      paddingLeft: "45px"
    }),
    css({
      paddingLeft: "55px"
    }),
  ],
  exams: [
    css({
      paddingLeft: "15px"
    }),
    css({
      paddingLeft: "25px"
    }),
    css({
      paddingLeft: "35px"
    }),
    css({
      paddingLeft: "45px"
    }),
    css({
      paddingLeft: "55px"
    }),
  ]
};

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

  renderCategory = (category: Category, depth: number): JSX.Element => {
    return (<div>
        {category.exams.map(exam => (
          <div key={exam} {...styles.exams[depth]}><Link to={"/exams/" + exam}>{exam}</Link></div>
        ))}
        {category.childCategories &&
        category.childCategories.map(childCat =>
          <div key={childCat.name}>
            <span {...styles.subtitle} {...styles.subtitles[depth]}>{childCat.name}</span>
            {this.renderCategory(childCat, depth+1)}
          </div>
        )}
      </div>
    );
  };

  render() {
    const categories = this.state.rootCategories;
    if (!categories) {
      return (<p>Loading exam list...</p>);
    }
    return (<div {...styles.wrapper}>
      {categories.map(category => (
        <div key={category.name} {...styles.category}>
          <h1>{this.categoryDisplay(category.name)}</h1>
          {this.renderCategory(category, 0)}
        </div>
      ))}</div>);
  }
};
