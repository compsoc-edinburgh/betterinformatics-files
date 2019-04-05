import * as React from "react";
import {CategoryExam, CategoryMetaData} from "../interfaces";
import {css} from "glamor";
import {fetchapi, fetchpost} from "../fetch-utils";
import {Link, Redirect} from "react-router-dom";

const styles = {
  wrapper: css({
  }),
};

interface Props {
  isAdmin?: boolean;
  categorySlug: string;
}

interface State {
  category: CategoryMetaData;
  exams: CategoryExam[];
  newAdminName: string;
  currentMetaData: CategoryMetaData;
  editingMetaData: boolean;
  redirectBack: boolean;
  error?: string;
}

export default class Category extends React.Component<Props, State> {

  state: State = {
    category: {
      category: "",
      slug: "",
      admins: [],
      semester: "",
      form: "",
      permission: "",
      offered_in: [],
      remark: "",
    },
    exams: [],
    newAdminName: "",
    currentMetaData: {
      category: "",
      slug: "",
      admins: [],
      semester: "",
      form: "",
      permission: "",
      offered_in: [],
      remark: "",
    },
    editingMetaData: false,
    redirectBack: false,
  };

  componentDidMount() {
    this.loadCategory();
    this.loadExams();
    document.title = this.props.categorySlug + " - VIS Community Solutions";
  }

  loadExams = () => {
    fetchapi('/api/category/list?slug=' + this.props.categorySlug)
      .then(res => {
        this.setState({
          exams: res.value
        });
      })
      .catch(()=>undefined);
  };

  loadCategory = () => {
    fetchapi('/api/category/metadata?slug=' + this.props.categorySlug)
      .then(res => {
        this.setState({
          category: res.value
        });
      })
      .catch(()=>undefined);
  };

  toggleEditingMetadata = () => {
    this.setState((prevState) => {
      return {
        editingMetaData: !prevState.editingMetaData,
      };
    });
    this.setState({
      currentMetaData: {...this.state.category}
    });
  };

  saveEdit = () => {
    let data = {...this.state.currentMetaData};
    data.category = this.state.category.category;
    data.slug = this.state.category.slug;
    fetchpost('/api/category/metadata', data)
      .then(() => {
        this.setState({
          editingMetaData: false
        });
        this.loadCategory();
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  cancelEdit = () => {
    this.setState({
      editingMetaData: false
    });
  };

  valueChanged = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.value;
    this.setState(prevState => {
      prevState.currentMetaData[key] = newVal;
      return prevState;
    });
  };

  addAdmin = () => {
    fetchpost('/api/category/addadmin', {
      slug: this.props.categorySlug,
      username: this.state.newAdminName,
    })
      .then(() => {
        this.setState({
          newAdminName: ""
        });
        this.loadCategory();
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  removeAdmin = (username: string) => {
    fetchpost('/api/category/removeadmin', {
      slug: this.props.categorySlug,
      username: username,
    })
      .then(() => {
        this.loadCategory();
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  removeCategory = () => {
    const confirmation = confirm("Remove category?");
    if (confirmation) {
      fetchpost('/api/category/remove', {
        slug: this.props.categorySlug,
      })
        .then(() => {
          this.setState({
            redirectBack: true
          });
        })
        .catch(err => {
          this.setState({
            error: err.toString()
          });
        });
    }
  };

  removeExam = (exam: CategoryExam) => {
    const confirmation = confirm("Remove exam? This will remove all answers and can not be undone!");
    if (confirmation) {
      const confirmation2 = prompt("Please enter '" + exam.displayname + "' to delete the exam.");
      if (confirmation2 === exam.displayname) {
        fetchpost(`/api/exam/${exam.filename}/remove`, {})
          .then(() => {
            this.loadExams();
          })
          .catch(err => {
            this.setState({
              error: err.toString()
            });
          });
      } else {
        alert("Name did not match. If you really want to delete the exam, try again.");
      }
    }
  };

  render() {
    if (this.state.redirectBack) {
      return <Redirect to="/"/>
    }
    if (!this.state.category) {
      return <div>Loading...</div>
    }
    const cat = this.state.category;
    return (<div {...styles.wrapper}>
      <h1>{cat.category}</h1>
      {this.state.category.semester && <p>Semester: {this.state.category.semester}</p>}
      {this.state.category.form && <p>Form: {this.state.category.form}</p>}
      {this.state.category.offered_in && <p>Offered in: {this.state.category.offered_in}</p>}
      {this.state.category.remark && <p>Remark: {this.state.category.remark}</p>}
      {this.state.error && <div>{this.state.error}</div>}
      {(this.props.isAdmin) && <p><button onClick={this.toggleEditingMetadata}>Edit Category</button></p>}
      {this.state.editingMetaData && <div>
        <h2>Meta Data</h2>
        <div>
          <input type="text" placeholder="semester" value={this.state.currentMetaData.semester} onChange={ev => this.valueChanged("semester", ev)}/>
          <input type="text" placeholder="form" value={this.state.currentMetaData.form} onChange={ev => this.valueChanged("form", ev)}/>
        </div>
        <div>
          <input type="text" placeholder="remark" value={this.state.currentMetaData.remark} onChange={ev => this.valueChanged("remark", ev)}/>
            <input type="text" placeholder="permission" value={this.state.currentMetaData.permission} onChange={ev => this.valueChanged("permission", ev)}/>
        </div>
        <div>
          <button onClick={this.saveEdit}>Save</button>
          <button onClick={this.cancelEdit}>Cancel</button>
        </div>
        <div>
          <h2>Admins</h2>
          <ul>
            {this.state.category.admins.map(admin => <li key={admin}>{admin} <button onClick={() => this.removeAdmin(admin)}>X</button></li>)}
          </ul>
          <input type="text" value={this.state.newAdminName} onChange={ev => this.setState({newAdminName: ev.target.value})} placeholder="new admin"/>
          <button onClick={this.addAdmin} disabled={this.state.newAdminName.length === 0}>Add Admin</button>
        </div>
        <div>
          <h2>Remove Category</h2>
          <button onClick={this.removeCategory}>Remove Category</button>
        </div>
      </div>}
      <h2>Exams</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Remark</th>
            {this.props.isAdmin && <th>Remove</th>}
          </tr>
        </thead>
        <tbody>
          {this.state.exams.filter(exam => exam.public || this.props.isAdmin).map(exam => (
            <tr key={exam.filename}>
              <td>
                <Link to={'/exams/' + exam.filename}>{exam.displayname}</Link>
              </td>
              <td>
                {exam.remark}
              </td>
              {this.props.isAdmin && <td>
                  <button onClick={ev => this.removeExam(exam)}>X</button>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>);
  }
}
