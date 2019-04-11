import * as React from "react";
import {CategoryExam, CategoryMetaData, MetaCategory} from "../interfaces";
import {css} from "glamor";
import {fetchapi, fetchpost} from "../fetch-utils";
import {Link, Redirect} from "react-router-dom";
import {getMetaCategoriesForCategory} from "../category-utils";
import AutocompleteInput from '../components/autocomplete-input';
import colors from "../colors";
import GlobalConsts from "../globalconsts";
import * as moment from 'moment';
import Colors from "../colors";
import {listenEnter} from "../input-utils";

const styles = {
  wrapper: css({
    maxWidth: "900px",
    margin: "auto",
  }),
  metdataWrapper: css({
    padding: "10px",
    marginBottom: "20px",
    background: Colors.cardBackground,
    boxShadow: Colors.cardShadow,
  }),
  unviewableExam: css({
    color: colors.unviewableExam,
  }),
};

interface Props {
  isAdmin?: boolean;
  username: string;
  categorySlug: string;
}

interface State {
  category?: CategoryMetaData;
  exams: CategoryExam[];
  examTypes: string[];
  metaCategories: MetaCategory[];
  newMeta1: string;
  newMeta2: string;
  newAdminName: string;
  currentMetaData: CategoryMetaData;
  editingMetaData: boolean;
  redirectBack: boolean;
  error?: string;
}

export default class Category extends React.Component<Props, State> {

  state: State = {
    exams: [],
    examTypes: [],
    metaCategories: [],
    newMeta1: "",
    newMeta2: "",
    newAdminName: "",
    currentMetaData: {
      category: "",
      slug: "",
      admins: [],
      semester: "",
      form: "",
      permission: "",
      remark: "",
      has_payments: false,
      catadmin: false,
    },
    editingMetaData: false,
    redirectBack: false,
  };

  componentDidMount() {
    this.loadCategory();
    this.loadExams();
    this.loadMetaCategories();
    document.title = this.props.categorySlug + " - VIS Community Solutions";
  }

  collectExamTypes = (exams: CategoryExam[]) => {
    let types = exams.map(exam => exam.examtype).filter(examtype => examtype);
    types.push("Exams");
    return types.filter((value, index, self) => self.indexOf(value) === index).sort();
  };

  loadExams = () => {
    fetchapi('/api/category/list?slug=' + this.props.categorySlug)
      .then(res => {
        this.setState({
          exams: res.value,
          examTypes: this.collectExamTypes(res.value),
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

  loadMetaCategories = () => {
    fetchapi('/api/listmetacategories')
      .then(res => {
        this.setState({
          metaCategories: res.value
        });
      })
      .catch(() => undefined);
  };

  toggleEditingMetadata = () => {
    this.setState((prevState) => {
      return {
        editingMetaData: !prevState.editingMetaData,
      };
    });
    if (this.state.category) {
      this.setState({
        currentMetaData: {...this.state.category}
      });
    }
  };

  saveEdit = () => {
    if (!this.state.category) {
      return;
    }
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

  checkboxValueChanged = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.checked;
    this.setState(prevState => {
      prevState.currentMetaData[key] = newVal;
      return prevState;
    });
  };

  addAdmin = () => {
    if (!this.state.newAdminName) {
      return;
    }
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

  addMetaCategory = () => {
    if (!this.state.newMeta1 || !this.state.newMeta2 || !this.state.category) {
      return;
    }
    fetchpost('/api/metacategory/addcategory', {
      meta1: this.state.newMeta1,
      meta2: this.state.newMeta2,
      category: this.state.category.category,
    })
      .then(() => {
        this.setState({
          newMeta1: "",
          newMeta2: "",
        });
        this.loadMetaCategories();
      })
      .catch(err => {
        this.setState({
          error: err.toString()
        });
      });
  };

  removeMetaCategory = (meta1: string, meta2: string) => {
    if (!this.state.category) {
      return;
    }
    fetchpost('/api/metacategory/removecategory', {
      meta1: meta1,
      meta2: meta2,
      category: this.state.category.category,
    })
      .then(() => {
        this.loadMetaCategories();
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

  flatArray = (arr: string[][]) => {
    let res: string[] = [];
    arr.forEach(a => {
      res.push.apply(res, a);
    });
    return res;
  };

  hasValidClaim = (exam: CategoryExam) => {
    if (exam.import_claim !== "") {
      if (moment().diff(moment(exam.import_claim_time, GlobalConsts.momentParseString)) < 4 * 60 * 60 * 1000) {
        return true;
      }
    }
    return false;
  };

  claimExam = (exam: CategoryExam, claim: boolean) => {
    fetchpost(`/api/exam/${exam.filename}/claim`, {
      claim: claim ? 1 : 0
    })
      .then(() => {
        this.loadExams();
        if (claim) {
          window.open("/exams/" + exam.filename);
        }
      })
      .catch(err => {
        this.setState({
          error: err
        });
        this.loadExams();
      });
  };

  render() {
    if (this.state.redirectBack) {
      return <Redirect to="/"/>;
    }
    if (!this.state.category) {
      return <div>Loading...</div>;
    }
    const catAdmin = this.props.isAdmin || this.state.category.catadmin;
    const cat = this.state.category;
    const offeredIn = getMetaCategoriesForCategory(this.state.metaCategories, cat.category);
    return (<div {...styles.wrapper}>
      <h1>{cat.category}</h1>
      {this.state.category.semester && <p>Semester: {this.state.category.semester}</p>}
      {this.state.category.form && <p>Form: {this.state.category.form}</p>}
      {offeredIn.length > 0 && <div>
        Offered in:
        <ul>
          {offeredIn.map(meta1 => meta1.meta2.map(meta2 => <li key={meta1.displayname + meta2.displayname}>{meta2.displayname} in {meta1.displayname}</li>))}
        </ul>
      </div>}
      {this.state.category.remark && <p>Remark: {this.state.category.remark}</p>}
      {this.state.category.has_payments && <p>You have to pay a deposit of 20 CHF in the VIS bureau in order to see oral exams. After submitting a report of your own oral exam you can get your deposit back.</p>}
      {catAdmin && <p>You can edit exams in this category. Please do so responsibly.</p>}
      {this.state.error && <div>{this.state.error}</div>}
      {(this.props.isAdmin) && <p><button onClick={this.toggleEditingMetadata}>Edit Category</button></p>}
      {this.state.editingMetaData && <div {...styles.metdataWrapper}>
        <h2>Meta Data</h2>
        <div>
          <AutocompleteInput name="semester" placeholder="semester" value={this.state.currentMetaData.semester} onChange={ev => this.valueChanged("semester", ev)} autocomplete={["HS", "FS"]}/>
          <AutocompleteInput name="form" placeholder="form" value={this.state.currentMetaData.form} onChange={ev => this.valueChanged("form", ev)} autocomplete={["written", "oral"]}/>
        </div>
        <div>
          <input type="text" placeholder="remark" value={this.state.currentMetaData.remark} onChange={ev => this.valueChanged("remark", ev)}/>
          <AutocompleteInput name="permission" placeholder="permission" value={this.state.currentMetaData.permission} onChange={ev => this.valueChanged("permission", ev)} autocomplete={["public", "intern", "hidden", "none"]}/>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={this.state.currentMetaData.has_payments} onChange={(ev) => this.checkboxValueChanged("has_payments", ev)}/>
            Has Payments
          </label>
        </div>
        <div>
          <button onClick={this.saveEdit}>Save</button>
          <button onClick={this.cancelEdit}>Cancel</button>
        </div>
        <div>
          <h2>Offered In</h2>
            <ul>
              {offeredIn.map(meta1 => meta1.meta2.map(meta2 => <li key={meta1.displayname + meta2.displayname}>{meta2.displayname} in {meta1.displayname} <button onClick={() => this.removeMetaCategory(meta1.displayname, meta2.displayname)}>X</button></li>))}
            </ul>
            <AutocompleteInput
              name="meta"
              onChange={ev => this.setState({newMeta1: ev.target.value})}
              value={this.state.newMeta1}
              placeholder="main category"
              onKeyPress={listenEnter(this.addMetaCategory)}
              autocomplete={this.state.metaCategories.map(meta1 => meta1.displayname)}/>
            <AutocompleteInput
              name="submeta"
              onChange={ev => this.setState({newMeta2: ev.target.value})}
              value={this.state.newMeta2}
              placeholder="sub category"
              onKeyPress={listenEnter(this.addMetaCategory)}
              autocomplete={this.flatArray(this.state.metaCategories.filter(meta1 => meta1.displayname === this.state.newMeta1).map(meta1 => meta1.meta2.map(meta2 => meta2.displayname)))}/>
            <button onClick={this.addMetaCategory} disabled={this.state.newMeta1.length === 0 || this.state.newMeta2.length === 0}>Add Offered In</button>
        </div>
        <div>
          <h2>Admins</h2>
          <ul>
            {this.state.category.admins.map(admin => <li key={admin}>{admin} <button onClick={() => this.removeAdmin(admin)}>X</button></li>)}
          </ul>
          <input type="text" value={this.state.newAdminName} onChange={ev => this.setState({newAdminName: ev.target.value})} placeholder="new admin" onKeyPress={listenEnter(this.addAdmin)}/>
          <button onClick={this.addAdmin} disabled={this.state.newAdminName.length === 0}>Add Admin</button>
        </div>
        <div>
          <h2>Remove Category</h2>
          <button onClick={this.removeCategory}>Remove Category</button>
        </div>
      </div>}
      {
        this.state.examTypes.map(examType => <div key={examType}>
          <h2>{examType}</h2>
          <table>
            <thead>
            <tr>
              <th>Name</th>
              <th>Remark</th>
              {catAdmin && <th>Public</th>}
              {catAdmin && <th>Import State</th>}
              {catAdmin && <th>Claim</th>}
              {this.props.isAdmin && <th>Remove</th>}
            </tr>
            </thead>
            <tbody>
            {this.state.exams
              .filter(exam => exam.public || catAdmin)
              .filter(exam => (exam.examtype || "Exams") === examType)
              .map(exam => (
              <tr key={exam.filename}>
                <td>
                  {exam.canView && <Link to={'/exams/' + exam.filename}>{exam.displayname}</Link> || <span {...styles.unviewableExam}>{exam.displayname}</span>}
                </td>
                <td>
                  {exam.remark}
                </td>
                {catAdmin && <td>{exam.public ? "Public": "Hidden"}</td>}
                {catAdmin && <td>
                  {exam.finished_cuts ? (exam.finished_wiki_transfer ? "All done" : "Needs Wiki Import") : "Needs Cuts"}
                </td>}
                {catAdmin && <td>
                  {(!exam.finished_cuts || !exam.finished_wiki_transfer) ? (
                    this.hasValidClaim(exam) ? (
                        exam.import_claim === this.props.username ?
                          <button onClick={() => this.claimExam(exam, false)}>Release Claim</button> :
                          <span>Claimed by {exam.import_claim_displayname}</span>
                      ) :
                      <button onClick={() => this.claimExam(exam, true)}>Claim Exam</button>
                  ) : <span>-</span>
                  }
                </td>}
                {this.props.isAdmin && <td>
                  <button onClick={ev => this.removeExam(exam)}>X</button>
                </td>}
              </tr>
            ))}
            </tbody>
          </table>
        </div>)
      }
    </div>);
  }
}
