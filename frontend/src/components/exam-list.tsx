import * as React from "react";
import {Link} from "react-router-dom";
import {css} from "glamor";
import {buildCategoryTree} from "../category-utils";
import {Category} from "../interfaces";

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

interface State {
  rootCategories?: Category[];
}

export default class ExamList extends React.Component<{}, State> {

  state: State = {};

  async componentWillMount() {
    fetch('/api/listcategories/withexams')
      .then(res => res.json())
      .then(res => this.setState({
        rootCategories: buildCategoryTree(res.value)
      }));
  }

  arrLast = (arr: string[]) => arr[arr.length - 1];

  categoryDisplay = (category: string) => this.arrLast(category.split("/"));

  renderCategory = (category: Category, depth: number): JSX.Element => {
    return (<div>
        {category.exams.map(exam => (
          <div key={exam.filename} {...styles.exams[depth]}><Link to={"/exams/" + exam.filename}>{exam.displayname}</Link></div>
        ))}
        {category.childCategories &&
        category.childCategories.map(childCat =>
          <div key={childCat.name}>
            <span {...styles.subtitle} {...styles.subtitles[depth]}>{this.categoryDisplay(childCat.name)}</span>
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
