import * as React from "react";
import {Category, Exam} from "../interfaces";
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
  sidebar: css({
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
  clipboard: css({
    border: "1px solid red",
    width: "100%"
  }),
  adminlist: css({
    border: "1px solid red",
    width: "100%"
  })
};

interface Props {
  isAdmin?: boolean;
}

interface State {
  rootCategories?: Category[];
  categoryStack: Category[];
  categoryAdmins?: object;
  clipboard: Exam[];
  newCategoryName: string;
  newAdminName: string;
}

export default class Categorize extends React.Component<Props, State> {

  state: State = {
    categoryStack: [],
    newCategoryName: "",
    newAdminName: "",
    clipboard: [],
  };

  async componentWillMount() {
    this.setState({
      categoryStack: [{name: "", exams: [], childCategories: []}]
    });
    this.updateCategories();
  }

  async componentWillUpdate() {
    if (this.props.isAdmin && !this.state.categoryAdmins) {
      this.updateAdmins();
    }
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

  updateAdmins = async () => {
    fetch('/api/listcategories/withadmins')
      .then(res => res.json())
      .then(res => {
        let newadmins = {};
        res.value.forEach((cat: {name: string, admins: string[]}) => {
          newadmins[cat.name] = cat.admins;
        });
        this.setState({
          categoryAdmins: newadmins
        });
      })
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

  removeCategory = async (category: Category) => {
    fetchpost('/api/category/remove', {category: category.name})
      .then(() => {
        this.updateCategories();
      });
  };

  moveToClipboard = async (exam: Exam) => {
    this.setState(prevState => {
      prevState.clipboard.push(exam);
      return {
        clipboard: prevState.clipboard
      };
    });
  };

  moveFromClipboard = async () => {
    const newCategory = this.arrLast(this.state.categoryStack).name;
    Promise.all(this.state.clipboard
      .map(exam => fetchpost(`/api/exam/${exam.filename}/metadata`, {category: newCategory})))
      .then(() => {
        this.setState({
          clipboard: []
        });
        this.updateCategories();
      });
  };

  addAdmin = async () => {
    fetchpost('/api/category/addadmin', {
      category: this.arrLast(this.state.categoryStack).name,
      username: this.state.newAdminName
    })
      .then(() => {
        this.updateAdmins();
        this.setState({
          newAdminName: ""
        });
      });
  };

  removeAdmin = async (username: string) => {
    fetchpost('/api/category/removeadmin', {
      category: this.arrLast(this.state.categoryStack).name,
      username: username
    })
      .then(() => {
        this.updateAdmins()
      });
  };

  onNewCategoryNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      newCategoryName: ev.target.value
    });
  };

  onAdminNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      newAdminName: ev.target.value
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
                {this.props.isAdmin && <button onClick={() => this.removeCategory(subCat)}>
                  X
                </button>}
              </div>)}
            {this.props.isAdmin && <div>
              <input type="text" onChange={this.onNewCategoryNameChange} value={this.state.newCategoryName}
                     placeholder="New Category..."/>
              <button onClick={this.addCategory}>Add Category</button>
            </div>}
          </div>
          <div {...styles.examlist}>
            {cat.exams.filter(exam => this.state.clipboard.filter(ex => ex.filename === exam.filename).length === 0).map(
              exam => <div key={exam.filename}>
                {exam.displayname}
                <button onClick={() => this.moveToClipboard(exam)}>&gt;&gt;</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div {...styles.sidebar}>
        <div {...styles.clipboard}>
          <div>Clipboard</div>
          <div>Drop exams here...</div>
          <div>
            {this.state.clipboard.map(exam =>
              <div key={exam.filename}>{exam.displayname}</div>
            )}
          </div>
          {this.props.isAdmin && this.state.clipboard.length > 0 && this.state.categoryStack.length >  1 && <div>
            <button onClick={this.moveFromClipboard}>&lt;&lt;</button>
          </div>}
        </div>
        {this.props.isAdmin && this.state.categoryAdmins && this.state.categoryStack.length > 1 && <div {...styles.adminlist}>
          <div>Category Admins</div>
          {this.state.categoryAdmins[cat.name] && this.state.categoryAdmins[cat.name].length > 0 ?
            this.state.categoryAdmins[cat.name].map((admin: string) => <div>{admin} <button onClick={() => this.removeAdmin(admin)}>X</button></div>) :
            <div>No admins</div>
          }
          <div>
            <input type="text" onChange={this.onAdminNameChange} value={this.state.newAdminName}
                   placeholder="New Admin..." />
            <button onClick={this.addAdmin}>Add Admin</button>
          </div>
        </div>}
      </div>
    </div>);
  }
}
