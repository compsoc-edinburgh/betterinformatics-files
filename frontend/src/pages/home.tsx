import * as React from "react";
import {css} from "glamor";
import Colors from "../colors";
import {CategoryMetaData, MetaCategory, MetaCategoryWithCategories} from "../interfaces";
import {fetchapi, fetchpost} from "../fetch-utils";
import {fillMetaCategories, filterCategories} from "../category-utils";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import globalcss from "../globalcss";
import {listenEnter} from "../input-utils";

const styles = {
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: "-15px",
    marginRight: "-15px",
    marginTop: "-15px",
    marginBottom: "20px",
    paddingLeft: "15px",
    paddingRight: "15px",
    paddingTop: "20px",
    paddingBottom: "20px",
    "@media (max-width: 799px)": {
      display: "block",
    }
  }),
  filterWrapper: css({
    flexGrow: "1",
  }),
  filterInput: css({
    width: "100%",
    display: "flex",
    justifyContent: "center",
    "& input": {
      width:  "60%",
      "@media (max-width: 799px)": {
        width: "80%",
      },
      "@media (max-width: 599px)": {
        width: "95%",
      },
    }
  }),
  sortWrapper: css({
    textAlign: "center",
    fontSize: "20px",
    marginBottom: "10px",
  }),
  sortWrapperInactive: css({
    cursor: "pointer",
  }),
  sortWrapperActive: css({
    fontWeight: "bold",
  }),
  buttonsWrapper: css({
    fontSize: "20px",
    display: "flex",
    "& div": {
      ...globalcss.button,
      marginRight: "10px",
    },
    "@media (max-width: 799px)": {
      marginTop: "10px",
    }
  }),
  categoriesWrapper: css({
    width: "100%",
    display: "flex",
    flexWrap: "wrap"
  }),
  category: css({
    background: Colors.cardBackground,
    width: "250px",
    padding: "20px",
    marginLeft: "20px",
    marginRight: "20px",
    marginBottom: "40px",
    borderRadius: "0px",
    boxShadow: Colors.cardShadow,
    cursor: "pointer",
  }),
  categoryTitle: css({
    fontSize: "24px",
    textTransform: "capitalize",
    marginBottom: "5px",
  }),
  categoryInfo: css({
    marginTop: "5px"
  }),
  addCategoryInput: css({
    width: "100%",
    marginLeft: "0",
  }),
  addCategorySubmit: css({
    width: "100%",
    marginLeft: "0",
    marginBottom: "20px",
  }),
};

interface Props {
  isAdmin?: boolean;
  isCategoryAdmin?: boolean;
}

interface State {
  categories: CategoryMetaData[];
  metaCategories: MetaCategory[];
  filter: string;
  bySemesterView: boolean;
  gotoCategory?: CategoryMetaData;
  addingCategory: boolean;
  newCategoryName: string;
  error?: boolean;
}


export default class Home extends React.Component<Props, State> {
  state: State = {
    filter: "",
    bySemesterView: false,
    categories: [],
    metaCategories: [],
    addingCategory: false,
    newCategoryName: "",
  };

  removeDefaultIfNecessary = (categories: CategoryMetaData[]) => {
    if (this.props.isAdmin) {
      return categories;
    } else {
      return categories.filter(cat => cat.category !== "default");
    }
  };

  componentDidMount() {
    this.loadCategories();
    this.loadMetaCategories();
    this.setState({
      bySemesterView: (localStorage.getItem("home_bySemesterView") || "0") !== "0"
    });
    document.title = "VIS Community Solutions";
  }

  loadCategories = () => {
    fetchapi('/api/listcategories/withmeta')
      .then(res => {
        this.setState({
          categories: this.removeDefaultIfNecessary(res.value)
        })
      })
      .catch(() => {
        this.setState({error: true});
      });
  };

  loadMetaCategories = () => {
    fetchapi('/api/listmetacategories')
      .then(res => {
        this.setState({
          metaCategories: res.value
        });
      });
  };

  filterChanged = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      filter: ev.target.value
    });
  };

  openFirstCategory = () => {
    const filtered = filterCategories(this.state.categories, this.state.filter);
    if (this.state.bySemesterView) {
      const categoriesBySemester = fillMetaCategories(filtered, this.state.metaCategories);
      let resorted: CategoryMetaData[] = [];
      categoriesBySemester.forEach(meta1 => {
        meta1.meta2.forEach(meta2 => {
          meta2.categories.forEach(cat => resorted.push(cat));
        })
      });
      if (resorted.length > 0) {
        this.gotoCategory(resorted[0]);
      }
    } else {
      if (filtered.length > 0) {
        this.gotoCategory(filtered[0]);
      }
    }
  };

  gotoCategory = (cat: CategoryMetaData) => {
    this.setState({
      gotoCategory: cat
    });
  };

  toggleAddingCategory = () => {
    this.setState(prevState => ({
      addingCategory: !prevState.addingCategory
    }));
  };

  addNewCategory = () => {
    if (!this.state.newCategoryName) {
      return;
    }
    fetchpost('/api/category/add', {
      category: this.state.newCategoryName
    })
      .then((res) => {
        this.setState({
          addingCategory: false,
          newCategoryName: "",
        });
        this.loadCategories();
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  setBySemesterView = (bySemester: boolean) => {
    this.setState({
      bySemesterView: bySemester
    });
    localStorage.setItem("home_bySemesterView", bySemester ? "1": "0");
  };

  addCategoryView = () => {
    return (<div {...styles.category}>
      <div {...styles.categoryTitle} onClick={this.toggleAddingCategory}>Add Category</div>
      {this.state.addingCategory && <div>
          <div>
              <input {...styles.addCategoryInput} value={this.state.newCategoryName}
                     onChange={ev => this.setState({newCategoryName: ev.target.value})}
                     type="text" autoFocus={true} onKeyPress={listenEnter(this.addNewCategory)}/>
          </div>
          <div><button {...styles.addCategorySubmit} disabled={this.state.newCategoryName.length === 0} onClick={this.addNewCategory}>Add Category</button></div>
      </div>}
    </div>);
  };

  categoryView = (category: CategoryMetaData) => {
    return (
      <div key={category.category} {...styles.category} onClick={() => this.gotoCategory(category)}>
        <div {...styles.categoryTitle} {...globalcss.noLinkColor}><Link to={'/category/' + category.slug}>{category.category}</Link></div>
        <div {...styles.categoryInfo} title={`There are ${category.examcountpublic} exams, of which ${category.examcountanswered} have at least one answer.`}>Exams: {category.examcountanswered} / {category.examcountpublic}</div>
        <div {...styles.categoryInfo} title={`Of all questions in all ${category.examcountpublic} exams, ${Math.round(category.answerprogress*100)}% have an answer.`}>Answers: {Math.round(category.answerprogress*100)}%</div>
      </div>
    );
  };

  alphabeticalView = (categories: CategoryMetaData[]) => {
    return (
      <div {...styles.categoriesWrapper}>
        {categories.map(category => this.categoryView(category))}
        {this.props.isAdmin && this.addCategoryView()}
      </div>);
  };

  semesterView = (categories: MetaCategoryWithCategories[]) => {
    return (
      <div>
        {categories.map(meta1 => <div key={meta1.displayname}>
          <h2>{meta1.displayname}</h2>
          {meta1.meta2.map(meta2 => <div key={meta2.displayname}>
            <h3>{meta2.displayname}</h3>
            <div {...styles.categoriesWrapper}>
              {meta2.categories.map(category => this.categoryView(category))}
            </div>
          </div>)}
        </div>)}
        {this.props.isAdmin &&
          <div>
            <h2>New Category</h2>
            <div {...styles.categoriesWrapper}>
              {this.addCategoryView()}
            </div>
          </div>
        }
      </div>
    );
  };

  render() {
    if (this.state.error) {
      return <div>Could not load exams...</div>;
    }
    if (this.state.gotoCategory) {
      return <Redirect to={'/category/' + this.state.gotoCategory.slug} push={true}/>
    }
    const categories = this.state.categories;
    if (!categories) {
      return (<p>Loading exam list...</p>);
    }
    const categoriesFiltered = filterCategories(categories, this.state.filter);
    const categoriesBySemester = fillMetaCategories(categoriesFiltered, this.state.metaCategories);
    return (<div>
      <div {...styles.header}>
        <div {...styles.filterWrapper}>
          <div {...styles.sortWrapper}>
            <span onClick={() => this.setBySemesterView(false)} {...(this.state.bySemesterView ? styles.sortWrapperInactive : styles.sortWrapperActive)}>Alphabetical</span> | <span onClick={() => this.setBySemesterView(true)} {...(this.state.bySemesterView ? styles.sortWrapperActive : styles.sortWrapperInactive)}>By Semester</span>
          </div>
          <div {...styles.filterInput}>
            <input type="text" onChange={this.filterChanged} value={this.state.filter}
                   placeholder="Filter..." autoFocus={true} onKeyPress={listenEnter(this.openFirstCategory)}/>
          </div>
        </div>
        <div {...styles.buttonsWrapper}>
          <div {...globalcss.noLinkColor}><Link to='/submittranscript'>Submit transcript</Link></div>
          {this.props.isCategoryAdmin && <div {...globalcss.noLinkColor}><Link to='/uploadpdf'>Upload Exam</Link></div>}
          {this.props.isCategoryAdmin && <div {...globalcss.noLinkColor}><Link to='/importqueue'>Import Queue</Link></div>}
        </div>
      </div>
      {this.state.bySemesterView ? this.semesterView(categoriesBySemester) : this.alphabeticalView(categoriesFiltered)}
    </div>);
  }
};
