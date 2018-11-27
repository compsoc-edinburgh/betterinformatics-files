import * as React from "react";
import {Link} from "react-router-dom";
import {css} from "glamor";
import {buildCategoryTree, filterCategoryTree} from "../category-utils";
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
  categoryTitle: css({
    textTransform: "capitalize",
    cursor: "pointer",
  }),
  subtitle: css({
    textTransform: "capitalize",
    fontWeight: "bold",
    cursor: "pointer",
  }),
  categoryActive: css({
    color: "#ff6130",
  }),
  filterInput: css({
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    marginBottom: "20px",
    "& input": {
      minWidth: "400px",
      width:  "50%"
    }
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
  filter: string;
  openCategory: string;
}

export default class ExamList extends React.Component<{}, State> {

  state: State = {filter: "", openCategory: ""};

  async componentWillMount() {
    fetch('/api/listcategories/withexams')
      .then(res => res.json())
      .then(res => this.setState({
        rootCategories: buildCategoryTree(res.value)
      }));
  }

  arrLast = (arr: string[]) => arr[arr.length - 1];

  categoryDisplay = (category: string) => this.arrLast(category.split("/"));

  showCategory = (category: string) => this.setState({openCategory: category});

  renderCategory = (category: Category, depth: number): JSX.Element => {
    return (<div>
        {this.state.openCategory === category.name && category.exams.map(exam => (
          <div key={exam.filename} {...styles.exams[depth]}><Link to={"/exams/" + exam.filename}>{exam.displayname}</Link></div>
        ))}
        {category.childCategories &&
        category.childCategories.map(childCat =>
          <div key={childCat.name}>
            <span
              {...styles.subtitle}
              {...(this.state.openCategory === childCat.name ? styles.categoryActive : undefined)}
              {...styles.subtitles[depth]}
              onClick={() => this.showCategory(childCat.name)}>
              {this.categoryDisplay(childCat.name)}
              </span>
            {this.renderCategory(childCat, depth+1)}
          </div>
        )}
      </div>
    );
  };

  openUniqueCategory = (category: Category[]): boolean => {
    if (category.length === 1) {
      const childCategories = category[0].childCategories;
      if (childCategories) {
        if (!this.openUniqueCategory(childCategories)) {
          if (this.state.openCategory !== category[0].name) {
            this.setState({
              openCategory: category[0].name
            });
          }
        }
      }
      return true;
    } else {
      return false;
    }
  };

  filterChanged = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (this.state.rootCategories) {
      this.openUniqueCategory(filterCategoryTree(this.state.rootCategories, ev.target.value, false));
    }
    this.setState({
      filter: ev.target.value
    });
  };

  render() {
    const categories = this.state.rootCategories;
    if (!categories) {
      return (<p>Loading exam list...</p>);
    }
    return (<div>
      <div {...styles.filterInput}>
        <input type="text" onChange={this.filterChanged} value={this.state.filter} placeholder="Filter..." autoFocus={true}/>
      </div>
      <div {...styles.wrapper}>
        {filterCategoryTree(categories, this.state.filter, false).map(category => (
          <div key={category.name} {...styles.category}>
            <h1
              {...styles.categoryTitle}
              {...(this.state.openCategory === category.name ? styles.categoryActive : undefined)}
              onClick={() => this.showCategory(category.name)}>
              {this.categoryDisplay(category.name)}
              </h1>
            {this.renderCategory(category, 0)}
          </div>
        ))}</div>
    </div>);
  }
};
