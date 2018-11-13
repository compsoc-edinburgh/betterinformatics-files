import * as React from "react";
import ExamCategory from "../components/exam-category"

interface Category {
  name: string;
  exams: string[];
}

interface State {
  exams: string[];
  categoryNames: string[];
  categories?: object;
  savedCategories?: object;
}

export default class Categorize extends React.Component<{}, State> {

  state: State = {
    exams: [],
    categoryNames: []
  };

  async componentWillMount() {
    try {
      const resExams = await (await fetch('/api/listexams')).json();
      const resCat = await (await fetch('/api/listcategories')).json();
      let categories = {};
      resCat.value.forEach((category: Category) => {
        category.exams.forEach((exam) => {
          categories[exam] = category.name;
        });
      });
      this.setState({
        exams: resExams.value,
        categoryNames: resCat.value.map((cat: Category) => cat.name),
        categories: categories,
        savedCategories: categories
      });
    } catch (e) {
      // TODO implement proper error handling
      console.log(e);
    }
  }

  async componentDidMount() {
    document.title = "VIS Community Solutions: Categorize Exams";
  }

  updateCategories = () => {
    fetch('/api/listcategories?exams=0')
      .then((res) => res.json())
      .then((res) => {
        this.setState({
          categoryNames: res.value.map((cat: Category) => cat.name)
        })
      })
      .catch((e) => {
        // TODO implement proper error handling
        console.log(e);
      });
  };

  // same as { ...(obj || {}), [key]: value }, but more readable... :P
  updateObj = (obj: object | undefined, key: string, value: string) => {
    let newObj = {};
    newObj[key] = value;
    return Object.assign({}, obj, newObj);
  };

  handleCategoryChange = (exam: string, value: string) => {
    this.setState((prevState) => ({
      categories: this.updateObj(prevState.categories, exam, value)
    }));
  };

  handleCategorySave = (exam: string, value: string) => {
    this.setState((prevState) => ({
      categories: this.updateObj(prevState.categories, exam, value),
      savedCategories: this.updateObj(prevState.savedCategories, exam, value)
    }));
    this.updateCategories();
  };

  render() {
    const {categories, savedCategories, categoryNames, exams} = this.state;
    if (!exams.length) {
      return <p>No exams!</p>;
    }
    if (!categories || !savedCategories) {
      return <p>Loading...</p>;
    }
    return exams.map(exam => (
      <ExamCategory key={exam} exam={exam} category={categories[exam]} savedCategory={savedCategories[exam]}
                    categories={categoryNames} onChange={this.handleCategoryChange} onSave={this.handleCategorySave}/>
    ));
  }
}
