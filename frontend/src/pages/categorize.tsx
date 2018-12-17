import * as React from "react";
import {Category, Exam} from "../interfaces";
import {buildCategoryTree, synchronizeTreeWithStack} from "../category-utils";
import {css} from "glamor";
import {fetchpost} from "../fetch-utils";
import {Link} from "react-router-dom";

const styles = {
  wrapper: css({
    display: "flex"
  }),
  category: css({
    width: "80%"
  }),
  sidebar: css({
    width: "20%",
    minHeight: "400px"
  }),
  categorywrapper: css({
    display: "flex"
  }),
  subcategories: css({
    width: "50%"
  }),
  categoryNameWrapper: css({
    display: "flex",
    alignItems: "center",
  }),
  categoryName: css({
    marginLeft: "10px",
    textTransform: "capitalize",
  }),
  subcategory: css({
    width: "100%",
    maxWidth: "400px",
    display: "flex",
  }),
  subcategoryGoto: css({
    textTransform: "capitalize",
    flexGrow: "1",
  }),
  subcategoryDelete: css({
    width: "70px",
    fontWeight: "bold",
  }),
  subcategoryNewName: css({
    flexGrow: "1",
  }),
  examlist: css({
    width: "50%"
  }),
  examEntry: css({
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    alignItems: "center",
  }),
  examName: css({
    marginLeft: "5px",
    flexGrow: "1",
  }),
  examDelete: css({
    width: "70px",
    fontWeight: "bold",
  }),
  clipboard: css({
    width: "100%"
  }),
  adminlist: css({
    width: "100%",
    marginBottom: "20px",
  }),
  adminEntry: css({
    display: "flex",
    alignItems: "center",
  }),
  adminName: css({
    flexGrow: "1",
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
    document.title = "Category Editor - VIS Community Solutions";
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
      })
      .catch(()=>undefined);
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
      .catch(()=>undefined);
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
      })
      .catch(()=>undefined);
  };

  removeCategory = async (category: Category) => {
    const confirmation = confirm("Remove category?");
    if (confirmation) {
      fetchpost('/api/category/remove', {category: category.name})
          .then(() => {
            this.updateCategories();
          })
          .catch(() => undefined);
    }
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
      })
      .catch(()=>undefined);
  };

  removeExam = async (exam: Exam) => {
    const confirmation = confirm("Remove exam? This can not be undone! All answers will be lost!");
    if (confirmation) {
      const confirmation2 = prompt("Please enter '" + exam.displayname + "' to delete the exam.");
      if (confirmation2 === exam.displayname) {
        fetchpost(`/api/exam/${exam.filename}/remove`, {})
            .then(() => {
              this.updateCategories();
            })
            .catch(() => undefined);
      } else {
        alert("Name did not match. If you really want to delete the exam, try again.");
      }
    }
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
      })
      .catch(()=>undefined);
  };

  removeAdmin = async (username: string) => {
    fetchpost('/api/category/removeadmin', {
      category: this.arrLast(this.state.categoryStack).name,
      username: username
    })
      .then(() => {
        this.updateAdmins()
      })
      .catch(()=>undefined);
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
        <div {...styles.categoryNameWrapper}>
          <div>{this.state.categoryStack.length > 1 && <button onClick={this.chooseParentcategory}>Back</button>}</div>
          <h1 {...styles.categoryName}>{cat.name}</h1>
        </div>
        <div {...styles.categorywrapper}>
          <div {...styles.subcategories}>
            {cat.childCategories && cat.childCategories.map(
              subCat => <div {...styles.subcategory} key={subCat.name}>
                <button {...styles.subcategoryGoto} onClick={() => this.chooseSubcategory(subCat)}>
                  {this.categoryDisplay(subCat.name)}
                </button>
                {this.props.isAdmin && <button {...styles.subcategoryDelete} onClick={() => this.removeCategory(subCat)} title="Delete Category">
                  X
                </button>}
              </div>)}
            {this.props.isAdmin && <div {...styles.subcategory}>
              <input {...styles.subcategoryNewName} type="text" onChange={this.onNewCategoryNameChange} value={this.state.newCategoryName}
                     placeholder="New Category..."/>
              <button onClick={this.addCategory} title="Add Category">Add Category</button>
            </div>}
          </div>
          <div {...styles.examlist}>
            {cat.exams.filter(exam => this.state.clipboard.filter(ex => ex.filename === exam.filename).length === 0).map(
              exam => <div {...styles.examEntry} key={exam.filename}>
                <Link {...styles.examName} to={"/exams/" + exam.filename}><span>{exam.displayname}</span></Link>
                <button onClick={() => this.moveToClipboard(exam)} title="Move exam to clipboard">&gt;&gt;</button>
                <button {...styles.examDelete} onClick={() => this.removeExam(exam)} title="Remove exam">X</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div {...styles.sidebar}>
        {this.props.isAdmin && this.state.categoryAdmins && this.state.categoryStack.length > 1 && <div {...styles.adminlist}>
          <h2>Category Admins</h2>
          {this.state.categoryAdmins[cat.name] && this.state.categoryAdmins[cat.name].length > 0 ?
            this.state.categoryAdmins[cat.name].map((admin: string) => <div {...styles.adminEntry}><span {...styles.adminName}>{admin}</span> <button onClick={() => this.removeAdmin(admin)} title="Remove Admin">X</button></div>) :
            <div>No admins</div>
          }
          <div>
            <input type="text" onChange={this.onAdminNameChange} value={this.state.newAdminName}
                   placeholder="New Admin..." />
            <button onClick={this.addAdmin} title="Add Admin">Add Admin</button>
          </div>
        </div>}
        <div {...styles.clipboard}>
          <h2>Clipboard</h2>
          {this.state.clipboard.length === 0 && <div>
            Move exams here to change category.
          </div>}
          <div>
            {this.state.clipboard.map(exam =>
              <div key={exam.filename}>{exam.displayname}</div>
            )}
          </div>
          {this.state.clipboard.length > 0 && this.state.categoryStack.length >  1 && <div>
            <button onClick={this.moveFromClipboard} title="Move exams to current category">&lt;&lt;</button>
          </div>}
        </div>
      </div>
    </div>);
  }
}
