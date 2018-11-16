import * as React from "react";
import {Category} from "../interfaces";
import {buildCategoryTree, synchronizeTreeWithStack} from "../category-utils";
import {css} from "glamor";
import {fetchpost} from "../fetch-utils";

const styles = {
  wrapper: css({
    border: "1px solid black",
    display: "flex"
  }),
  category: css({
    border: "1px solid blue",
    width: "80%"
  }),
  clipboard: css({
    border: "1px solid red",
    width: "20%",
    minHeight: "400px"
  }),
  categorywrapper: css({
    display: "flex"
  }),
  subcategories: css({
    border: "1px solid red",
    width: "50%"
  }),
  examlist: css({
    border: "1px solid red",
    width: "50%"
  }),
  adminlist: css({
    border: "1px solid red"
  })
};

interface State {
  rootCategories?: Category[];
  categoryStack: Category[];
  newCategoryName: string;
}

export default class Categorize extends React.Component<{}, State> {

  state: State = {
    categoryStack: [],
    newCategoryName: "",
  };

  async componentWillMount() {
    this.setState({
      categoryStack: [{name: "", exams: [], childCategories: []}]
    });
    this.updateCategories();
  }

  async componentDidMount() {
    document.title = "VIS Community Solutions: Category Editor";
  }

  updateCategories = async () => {
    fetch('/api/listcategories/withexams')
      .then(res => res.json())
      .then(res => {
        const categoryTree = buildCategoryTree(res.value);
        this.setState(prevState => {
          const newStack = synchronizeTreeWithStack(categoryTree, prevState.categoryStack);
          return {
            categoryStack: newStack,
            rootCategories: categoryTree
          }
        })
      });
  };

  arrLast = (arr: Category[]) => arr[arr.length - 1];
  arrLastStr = (arr: string[]) => arr[arr.length - 1];

  categoryDisplay = (category: string) => this.arrLastStr(category.split("/"));

  chooseSubcategory = (subcategory: Category) => {
    this.setState(prevState => ({
      categoryStack: prevState.categoryStack.concat(subcategory)
    }));
  };

  chooseParentcategory = () =>
    this.setState(prevState => ({
      categoryStack: prevState.categoryStack.slice(0, -1)
    }));

  addCategory = async () => {
    const newName = this.state.categoryStack.length === 1 ?
      this.state.newCategoryName :
      this.arrLast(this.state.categoryStack).name + "/" + this.state.newCategoryName;
    fetchpost('/api/category/add', {category: newName})
      .then(() => {
        this.updateCategories();
        this.setState({
          newCategoryName: ""
        });
      });
  };

  onNewCategoryNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      newCategoryName: ev.target.value
    });
  };

  render() {
    if (!this.state.rootCategories) {
      return <div>Loading...</div>
    }
    const cat = this.arrLast(this.state.categoryStack);
    return (<div {...styles.wrapper}>
      <div {...styles.category}>
        <div>{cat.name}</div>
        <div>{this.state.categoryStack.length > 1 && <button onClick={this.chooseParentcategory}>Go up</button>}</div>
        <div {...styles.categorywrapper}>
          <div {...styles.subcategories}>
            {cat.childCategories && cat.childCategories.map(
              subCat => <div key={subCat.name}>
                <button onClick={() => this.chooseSubcategory(subCat)}>
                  {this.categoryDisplay(subCat.name)}
                </button>
              </div>)}
              <div>
                <input type="text" onChange={this.onNewCategoryNameChange} value={this.state.newCategoryName} placeholder="New Category..."/>
                <button onClick={this.addCategory}>Add Category</button>
              </div>
          </div>
          <div {...styles.examlist}>
            {cat.exams.map(
              exam => <div key={exam.filename}>
                {exam.displayname}
              </div>
            )}
          </div>
          <div {...styles.adminlist}>

          </div>
        </div>
      </div>
      <div {...styles.clipboard}>
        <div>Clipboard</div>
        <div>Drop exams here...</div>
      </div>
    </div>);
  }
}
