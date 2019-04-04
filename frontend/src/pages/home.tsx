import * as React from "react";
import {css} from "glamor";
import Colors from "../colors";
import {CategoryMetaData} from "../interfaces";
import {fetchapi, fetchpost} from "../fetch-utils";
import {filterCategories} from "../category-utils";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";

const styles = {
  wrapper: css({
    width: "100%",
    display: "flex",
    flexWrap: "wrap"
  }),
  category: css({
    background: Colors.cardBackground,
    width: "250px",
    paddingLeft: "20px",
    paddingRight: "20px",
    marginLeft: "20px",
    marginRight: "20px",
    marginBottom: "40px",
    borderRadius: "0px",
    boxShadow: Colors.cardShadow,
  }),
  categoryTitle: css({
    textTransform: "capitalize",
    cursor: "pointer",
  }),
  categoryActive: css({
    color: Colors.activeCategory,
  }),
  filterInput: css({
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    marginBottom: "20px",
    "& input": {
      width:  "50%",
      "@media (max-width: 799px)": {
        width: "70%",
      },
      "@media (max-width: 599px)": {
        width: "90%",
      },
    }
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
  noLinkColor: css({
    "& a": {
      ":link": {
        color: "inherit"
      },
      ":visited": {
        color: "inherit"
      }
    }
  })
};

interface Props {
  isAdmin?: boolean;
  isCategoryAdmin?: boolean;
}

interface State {
  categories: CategoryMetaData[];
  filter: string;
  gotoCategory?: CategoryMetaData;
  addingCategory: boolean;
  newCategoryName: string;
  error?: boolean;
}


export default class Home extends React.Component<Props, State> {
  state: State = {
    filter: "",
    categories: [],
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
    document.title = "VIS Community Solutions";
  }

  loadCategories = () => {
    fetchapi('/api/listcategories/withmeta')
      .then(res => this.setState({
        categories: this.removeDefaultIfNecessary(res.value)
      }))
      .catch(() => {
        this.setState({error: true});
      });
  };

  filterChanged = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      filter: ev.target.value
    });
  };

  filterKeyPress = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') {
      const filtered = filterCategories(this.state.categories, this.state.filter);
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
    fetchpost('/api/category/add', {
      category: this.state.newCategoryName
    })
      .then(() => {
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

  render() {
    if (this.state.error) {
      return <div>Could not load exams...</div>;
    }
    if (this.state.gotoCategory) {
      return <Redirect to={'/category/' + this.state.gotoCategory.slug}/>
    }
    const categories = this.state.categories;
    if (!categories) {
      return (<p>Loading exam list...</p>);
    }
    return (<div>
      <div {...styles.filterInput}>
        <input type="text" onChange={this.filterChanged} value={this.state.filter}
               placeholder="Filter..." autoFocus={true} onKeyPress={this.filterKeyPress}/>
      </div>
      <div {...styles.wrapper}>
        {filterCategories(categories, this.state.filter).map(category => (
          <div key={category.category} {...styles.category} onClick={() => this.gotoCategory(category)}>
            <h1 {...styles.categoryTitle}>{category.category}</h1>
          </div>
        ))}
        {this.props.isCategoryAdmin &&
        <div {...styles.category} {...styles.noLinkColor}>
          <Link to='/uploadpdf'><h1 {...styles.categoryTitle}>Upload Exam</h1></Link>
        </div>}
        {this.props.isAdmin &&
        <div {...styles.category}>
            <h1 {...styles.categoryTitle} onClick={this.toggleAddingCategory}>Add Category</h1>
          {this.state.addingCategory && <div>
              <div>
                <input {...styles.addCategoryInput} value={this.state.newCategoryName}
                       onChange={ev => this.setState({newCategoryName: ev.target.value})}
                       type="text" autoFocus={true}/>
              </div>
              <div><button {...styles.addCategorySubmit} disabled={this.state.newCategoryName.length === 0} onClick={this.addNewCategory}>Add Category</button></div>
          </div>}
        </div>}
      </div>
    </div>);
  }
};
