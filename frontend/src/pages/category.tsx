import * as React from "react";
import {
  Attachment,
  CategoryExam,
  CategoryMetaData,
  MetaCategory,
} from "../interfaces";
import { css } from "glamor";
import { fetchapi, fetchpost } from "../fetch-utils";
import { Link, Redirect } from "react-router-dom";
import {
  filterExams,
  filterMatches,
  getMetaCategoriesForCategory,
} from "../category-utils";
import AutocompleteInput from "../components/autocomplete-input";
import colors from "../colors";
import GlobalConsts from "../globalconsts";
import moment from "moment";
import Colors from "../colors";
import { listenEnter } from "../input-utils";
import Attachments from "../components/attachments";
import TextLink from "../components/text-link";
import { KeysWhereValue } from "../ts-utils";

const styles = {
  wrapper: css({
    maxWidth: "900px",
    margin: "auto",
  }),
  metadata: css({
    marginBottom: "4px",
  }),
  offeredIn: css({
    marginTop: "4px",
    marginBottom: "4px",
  }),
  metdataWrapper: css({
    padding: "10px",
    marginBottom: "20px",
    background: Colors.cardBackground,
    boxShadow: Colors.cardShadow,
  }),
  unviewableExam: css({
    color: colors.inactiveElement,
  }),
  filterInput: css({
    width: "100%",
    marginTop: "20px",
    marginBottom: "20px",
    "& input": {
      width: "50%",
      "@media (max-width: 799px)": {
        width: "70%",
      },
      "@media (max-width: 599px)": {
        width: "90%",
      },
    },
  }),
  examsTable: css({
    width: "100%",
    marginBottom: "20px",
  }),
  selectionColumn: css({
    width: "50px",
    textAlign: "center",
  }),
  selectionButtons: css({
    display: "flex",
  }),
  selectionButton: css({
    cursor: "pointer",
    marginLeft: "5px",
  }),
  selectionImg: css({
    height: "20px",
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
  filter: string;
  newMeta1: string;
  newMeta2: string;
  newAdminName: string;
  newExpertName: string;
  currentMetaData: CategoryMetaData;
  editingMetaData: boolean;
  gotoExam?: CategoryExam;
  redirectBack: boolean;
  error?: string;
  selectedExams: Set<string>;
}

export default class Category extends React.Component<Props, State> {
  state: State = {
    exams: [],
    examTypes: [],
    metaCategories: [],
    filter: "",
    newMeta1: "",
    newMeta2: "",
    newAdminName: "",
    newExpertName: "",
    currentMetaData: {
      category: "",
      slug: "",
      admins: [],
      experts: [],
      semester: "",
      form: "",
      permission: "",
      remark: "",
      has_payments: false,
      catadmin: false,
      more_exams_link: "",
      examcountpublic: 0,
      examcountanswered: 0,
      answerprogress: 0,
      attachments: [],
    },
    editingMetaData: false,
    redirectBack: false,
    selectedExams: new Set<string>(),
  };

  componentDidMount() {
    this.loadCategory();
    this.loadExams();
    this.loadMetaCategories();
    document.title = this.props.categorySlug + " - VIS Community Solutions";
  }

  collectExamTypes = (exams: CategoryExam[]) => {
    const types = exams.map(exam => exam.examtype).filter(examtype => examtype);
    types.push("Exams");
    return types
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  };

  loadExams = () => {
    fetchapi("/api/category/list?slug=" + this.props.categorySlug)
      .then(res => {
        this.setState({
          exams: res.value,
          examTypes: this.collectExamTypes(res.value),
        });
      })
      .catch(() => undefined);
  };

  loadCategory = () => {
    fetchapi("/api/category/metadata?slug=" + this.props.categorySlug)
      .then(res => {
        this.setState({
          category: res.value,
        });
        document.title = res.value.category + " - VIS Community Solutions";
      })
      .catch(() => undefined);
  };

  loadMetaCategories = () => {
    fetchapi("/api/listmetacategories")
      .then(res => {
        this.setState({
          metaCategories: res.value,
        });
      })
      .catch(() => undefined);
  };

  toggleEditingMetadata = () => {
    this.setState(prevState => ({
      editingMetaData: !prevState.editingMetaData,
    }));
    if (this.state.category) {
      this.setState({
        currentMetaData: { ...this.state.category },
      });
    }
  };

  saveEdit = () => {
    if (!this.state.category) {
      return;
    }
    const data = { ...this.state.currentMetaData };
    data.category = this.state.category.category;
    data.slug = this.state.category.slug;
    fetchpost("/api/category/metadata", data)
      .then(() => {
        this.setState({
          editingMetaData: false,
        });
        this.loadCategory();
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  cancelEdit = () => {
    this.setState({
      editingMetaData: false,
    });
  };

  filterChanged = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      filter: ev.target.value,
    });
  };

  openFirstExam = () => {
    const filtered = filterExams(this.state.exams, this.state.filter);
    if (filtered.length > 0) {
      this.gotoExam(filtered[0]);
    }
  };

  gotoExam = (cat: CategoryExam) => {
    this.setState({
      gotoExam: cat,
    });
  };

  valueChanged = (
    key: KeysWhereValue<CategoryMetaData, string>,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newVal = event.target.value;
    this.setState(prevState => ({
      currentMetaData: {
        ...prevState.currentMetaData,
        [key]: newVal,
      },
    }));
  };

  checkboxValueChanged = (
    key: KeysWhereValue<CategoryMetaData, boolean>,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newVal = event.target.checked;
    this.setState(prevState => ({
      currentMetaData: {
        ...prevState.currentMetaData,
        [key]: newVal,
      },
    }));
  };

  // "whether current user wants to download this" is not a metadata of the category, so different fun
  selectedExamsCheckboxValueChanged = (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newVal = event.target.checked;
    if (newVal) {
      this.setState(prevState => {
        const newSelectedExams = new Set(prevState.selectedExams);
        newSelectedExams.add(key);
        return {
          selectedExams: newSelectedExams,
        };
      });
    } else {
      this.setState(prevState => {
        const newSelectedExams = new Set(prevState.selectedExams);
        newSelectedExams.delete(key);
        return {
          selectedExams: newSelectedExams,
        };
      });
    }
  };

  selectAllExams = (examType: string) => {
    this.setState(prevState => {
      const newSelectedExams = new Set(prevState.selectedExams);
      for (const exam of prevState.exams) {
        const currExamtype = exam.examtype ? exam.examtype : "Exams";
        if (currExamtype === examType && exam.canView)
          newSelectedExams.add(exam.filename);
      }
      return {
        selectedExams: newSelectedExams,
      };
    });
  };

  unselectAllExams = (examType: string) => {
    this.setState(prevState => {
      const newSelectedExams = new Set(prevState.selectedExams);
      for (const exam of prevState.exams) {
        const currExamtype = exam.examtype ? exam.examtype : "Exams";
        if (currExamtype === examType && exam.canView)
          newSelectedExams.delete(exam.filename);
      }
      return {
        selectedExams: newSelectedExams,
      };
    });
  };

  // https://stackoverflow.com/questions/17793183/how-to-replace-window-open-with-a-post
  dlSelectedExams = () => {
    if (!this.state.category) return;
    const form = document.createElement("form");
    form.action = "/api/zip/" + this.state.category.category + "?download";
    form.method = "POST";
    form.target = "_blank";
    this.state.selectedExams.forEach(filename => {
      const input = document.createElement("textarea");
      input.name = "filenames";
      input.value = filename;
      form.appendChild(input);
    });
    form.style.display = "none";
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  addToSet = (key: string, value: string) => {
    return fetchpost("/api/category/addtoset", {
      slug: this.props.categorySlug,
      key: key,
      value: value,
    })
      .then(() => {
        this.loadCategory();
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  pullSet = (key: string, value: string) => {
    return fetchpost("/api/category/pullset", {
      slug: this.props.categorySlug,
      key: key,
      value: value,
    })
      .then(() => {
        this.loadCategory();
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  addAdmin = () => {
    if (!this.state.newAdminName) {
      return;
    }
    this.addToSet("admins", this.state.newAdminName).then(() => {
      this.setState({
        newAdminName: "",
      });
    });
  };

  removeAdmin = (username: string) => {
    this.pullSet("admins", username);
  };

  addExpert = () => {
    if (!this.state.newExpertName) {
      return;
    }
    this.addToSet("experts", this.state.newExpertName).then(() => {
      this.setState({
        newExpertName: "",
      });
    });
  };

  removeExpert = (username: string) => {
    this.pullSet("experts", username);
  };

  addMetaCategory = () => {
    if (!this.state.newMeta1 || !this.state.newMeta2 || !this.state.category) {
      return;
    }
    fetchpost("/api/metacategory/addcategory", {
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
          error: err.toString(),
        });
      });
  };

  removeMetaCategory = (meta1: string, meta2: string) => {
    if (!this.state.category) {
      return;
    }
    fetchpost("/api/metacategory/removecategory", {
      meta1: meta1,
      meta2: meta2,
      category: this.state.category.category,
    })
      .then(() => {
        this.loadMetaCategories();
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  removeCategory = () => {
    // eslint-disable-next-line no-restricted-globals
    const confirmation = confirm("Remove category?");
    if (confirmation) {
      fetchpost("/api/category/remove", {
        slug: this.props.categorySlug,
      })
        .then(() => {
          this.setState({
            redirectBack: true,
          });
        })
        .catch(err => {
          this.setState({
            error: err.toString(),
          });
        });
    }
  };

  removeExam = (exam: CategoryExam) => {
    // eslint-disable-next-line no-restricted-globals
    const confirmation = confirm(
      "Remove exam? This will remove all answers and can not be undone!",
    );
    if (confirmation) {
      const confirmation2 = prompt(
        "Please enter '" + exam.displayname + "' to delete the exam.",
      );
      if (confirmation2 === exam.displayname) {
        fetchpost(`/api/exam/${exam.filename}/remove`, {})
          .then(() => {
            this.loadExams();
          })
          .catch(err => {
            this.setState({
              error: err.toString(),
            });
          });
      } else {
        alert(
          "Name did not match. If you really want to delete the exam, try again.",
        );
      }
    }
  };

  flatArray = (arr: string[][]) => {
    const res: string[] = [];
    arr.forEach(a => {
      res.push.apply(res, a);
    });
    return res;
  };

  hasValidClaim = (exam: CategoryExam) => {
    if (exam.import_claim !== "") {
      if (
        moment().diff(
          moment(exam.import_claim_time, GlobalConsts.momentParseString),
        ) <
        4 * 60 * 60 * 1000
      ) {
        return true;
      }
    }
    return false;
  };

  claimExam = (exam: CategoryExam, claim: boolean) => {
    fetchpost(`/api/exam/${exam.filename}/claim`, {
      claim: claim ? 1 : 0,
    })
      .then(() => {
        this.loadExams();
        if (claim) {
          window.open("/exams/" + exam.filename);
        }
      })
      .catch(err => {
        this.setState({
          error: err,
        });
        this.loadExams();
      });
  };

  addAttachment = (att: Attachment) => {
    this.setState(prevState => ({
      currentMetaData: {
        ...prevState.currentMetaData,
        attachments: [...prevState.currentMetaData.attachments, att],
      },
    }));
    fetchpost("/api/category/addtoset", {
      slug: this.props.categorySlug,
      key: "json:attachments",
      value: JSON.stringify(att),
    }).then(res => {
      this.loadCategory();
    });
  };

  removeAttachment = (att: Attachment) => {
    this.setState(prevState => ({
      currentMetaData: {
        ...prevState.currentMetaData,
        attachments: prevState.currentMetaData.attachments.filter(
          attachment => attachment !== att,
        ),
      },
    }));
    fetchpost("/api/category/pullset", {
      slug: this.props.categorySlug,
      key: "json:attachments",
      value: JSON.stringify(att),
    }).then(res => {
      this.loadCategory();
    });
  };

  render() {
    if (this.state.redirectBack) {
      return <Redirect to="/" />;
    }
    if (this.state.gotoExam) {
      return (
        <Redirect to={"/exams/" + this.state.gotoExam.filename} push={true} />
      );
    }
    if (!this.state.category) {
      return <div>Loading...</div>;
    }
    const catAdmin = this.props.isAdmin || this.state.category.catadmin;
    const cat = this.state.category;
    const offeredIn = getMetaCategoriesForCategory(
      this.state.metaCategories,
      cat.category,
    );
    const viewableExams = this.state.exams
      .filter(exam => exam.public || catAdmin)
      .filter(exam => filterMatches(this.state.filter, exam.displayname));
    const attachments =
      this.state.currentMetaData.attachments.length > 0
        ? this.state.currentMetaData.attachments
        : this.state.category.attachments;
    return (
      <div {...styles.wrapper}>
        <h1>{cat.category}</h1>
        <div>
          {this.state.category.semester && (
            <div {...styles.metadata}>
              Semester: {this.state.category.semester}
            </div>
          )}
          {this.state.category.form && (
            <div {...styles.metadata}>Form: {this.state.category.form}</div>
          )}
          {offeredIn.length > 0 && (
            <div {...styles.metadata}>
              Offered in:
              <ul {...styles.offeredIn}>
                {offeredIn.map(meta1 =>
                  meta1.meta2.map(meta2 => (
                    <li key={meta1.displayname + meta2.displayname}>
                      {meta2.displayname} in {meta1.displayname}
                    </li>
                  )),
                )}
              </ul>
            </div>
          )}
          {this.state.category.remark && (
            <div {...styles.metadata}>Remark: {this.state.category.remark}</div>
          )}
          {this.state.category.more_exams_link && (
            <div {...styles.metadata}>
              <a
                href={this.state.category.more_exams_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Additional Exams
              </a>
            </div>
          )}
          {this.state.category.has_payments && (
            <div {...styles.metadata}>
              You have to pay a deposit of 20 CHF in the VIS bureau in order to
              see oral exams.
              <br />
              After submitting a report of your own oral exam you can get your
              deposit back.
            </div>
          )}
          {catAdmin && (
            <div {...styles.metadata}>
              You can edit exams in this category. Please do so responsibly.
            </div>
          )}
          {this.state.currentMetaData.experts.indexOf(this.props.username) !==
            -1 && (
            <div {...styles.metadata}>
              You are an expert for this category. You can endorse correct
              answers.
            </div>
          )}
          {this.state.error && (
            <div {...styles.metadata}>{this.state.error}</div>
          )}
          {this.props.isAdmin && (
            <div {...styles.metadata}>
              <button onClick={this.toggleEditingMetadata}>
                Edit Category
              </button>
            </div>
          )}
          {this.state.editingMetaData && (
            <div {...styles.metdataWrapper}>
              <h2>Meta Data</h2>
              <div>
                <AutocompleteInput
                  name="semester"
                  placeholder="semester"
                  value={this.state.currentMetaData.semester}
                  onChange={ev => this.valueChanged("semester", ev)}
                  autocomplete={["HS", "FS"]}
                />
                <AutocompleteInput
                  name="form"
                  placeholder="form"
                  value={this.state.currentMetaData.form}
                  onChange={ev => this.valueChanged("form", ev)}
                  autocomplete={["written", "oral"]}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="remark"
                  value={this.state.currentMetaData.remark}
                  onChange={ev => this.valueChanged("remark", ev)}
                />
                <AutocompleteInput
                  name="permission"
                  placeholder="permission"
                  value={this.state.currentMetaData.permission}
                  onChange={ev => this.valueChanged("permission", ev)}
                  autocomplete={["public", "intern", "hidden", "none"]}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="more exams link"
                  value={this.state.currentMetaData.more_exams_link}
                  onChange={ev => this.valueChanged("more_exams_link", ev)}
                />
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={this.state.currentMetaData.has_payments}
                    onChange={ev =>
                      this.checkboxValueChanged("has_payments", ev)
                    }
                  />
                  Has Payments
                </label>
              </div>
              <div>
                <button onClick={this.saveEdit}>Save</button>
                <button onClick={this.cancelEdit}>Cancel</button>
              </div>
              <div>
                <h2>Attachments</h2>
                <Attachments
                  attachments={this.state.currentMetaData.attachments}
                  onAddAttachment={this.addAttachment}
                  onRemoveAttachment={this.removeAttachment}
                />
              </div>
              <div>
                <h2>Offered In</h2>
                <ul>
                  {offeredIn.map(meta1 =>
                    meta1.meta2.map(meta2 => (
                      <li key={meta1.displayname + meta2.displayname}>
                        {meta2.displayname} in {meta1.displayname}{" "}
                        <button
                          onClick={() =>
                            this.removeMetaCategory(
                              meta1.displayname,
                              meta2.displayname,
                            )
                          }
                        >
                          X
                        </button>
                      </li>
                    )),
                  )}
                </ul>
                <AutocompleteInput
                  name="meta"
                  onChange={ev => this.setState({ newMeta1: ev.target.value })}
                  value={this.state.newMeta1}
                  placeholder="main category"
                  onKeyPress={listenEnter(this.addMetaCategory)}
                  autocomplete={this.state.metaCategories.map(
                    meta1 => meta1.displayname,
                  )}
                />
                <AutocompleteInput
                  name="submeta"
                  onChange={ev => this.setState({ newMeta2: ev.target.value })}
                  value={this.state.newMeta2}
                  placeholder="sub category"
                  onKeyPress={listenEnter(this.addMetaCategory)}
                  autocomplete={this.flatArray(
                    this.state.metaCategories
                      .filter(
                        meta1 => meta1.displayname === this.state.newMeta1,
                      )
                      .map(meta1 =>
                        meta1.meta2.map(meta2 => meta2.displayname),
                      ),
                  )}
                />
                <button
                  onClick={this.addMetaCategory}
                  disabled={
                    this.state.newMeta1.length === 0 ||
                    this.state.newMeta2.length === 0
                  }
                >
                  Add Offered In
                </button>
              </div>
              <div>
                <h2>Admins</h2>
                <ul>
                  {this.state.category.admins.map(admin => (
                    <li key={admin}>
                      {admin}{" "}
                      <button onClick={() => this.removeAdmin(admin)}>X</button>
                    </li>
                  ))}
                </ul>
                <input
                  type="text"
                  value={this.state.newAdminName}
                  onChange={ev =>
                    this.setState({ newAdminName: ev.target.value })
                  }
                  placeholder="new admin"
                  onKeyPress={listenEnter(this.addAdmin)}
                />
                <button
                  onClick={this.addAdmin}
                  disabled={this.state.newAdminName.length === 0}
                >
                  Add Admin
                </button>
              </div>
              <div>
                <h2>Experts</h2>
                <ul>
                  {this.state.category.experts.map(expert => (
                    <li key={expert}>
                      {expert}{" "}
                      <button onClick={() => this.removeExpert(expert)}>
                        X
                      </button>
                    </li>
                  ))}
                </ul>
                <input
                  type="text"
                  value={this.state.newExpertName}
                  onChange={ev =>
                    this.setState({ newExpertName: ev.target.value })
                  }
                  placeholder="new expert"
                  onKeyPress={listenEnter(this.addExpert)}
                />
                <button
                  onClick={this.addExpert}
                  disabled={this.state.newExpertName.length === 0}
                >
                  Add Expert
                </button>
              </div>
              <div>
                <h2>Remove Category</h2>
                <button onClick={this.removeCategory}>Remove Category</button>
              </div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={this.dlSelectedExams}
            disabled={this.state.selectedExams.size === 0}
          >
            Download selected exams
          </button>
        </div>

        <div {...styles.filterInput}>
          <input
            type="text"
            onChange={this.filterChanged}
            value={this.state.filter}
            placeholder="Filter..."
            autoFocus={true}
            onKeyPress={listenEnter(this.openFirstExam)}
          />
        </div>
        {this.state.examTypes
          .filter(
            examType =>
              viewableExams.filter(
                exam => (exam.examtype || "Exams") === examType,
              ).length > 0,
          )
          .map(examType => (
            <div key={examType}>
              <h2>
                <TextLink to={"#" + examType} id={examType}>
                  {examType}
                </TextLink>
              </h2>
              <table {...styles.examsTable}>
                <thead>
                  <tr>
                    <th {...styles.selectionColumn}>
                      <div {...styles.selectionButtons}>
                        <div
                          {...styles.selectionButton}
                          onClick={ev => this.selectAllExams(examType)}
                        >
                          <img
                            {...styles.selectionImg}
                            src="/static/select_all.svg"
                            title="Select All"
                            alt="Select All"
                          />
                        </div>
                        <div
                          {...styles.selectionButton}
                          onClick={ev => this.unselectAllExams(examType)}
                        >
                          <img
                            {...styles.selectionImg}
                            src="/static/deselect_all.svg"
                            title="Deselect All"
                            alt="Deselect All"
                          />
                        </div>
                      </div>
                    </th>
                    <th>Name</th>
                    <th>Remark</th>
                    <th>Answers</th>
                    {catAdmin && <th>Public</th>}
                    {catAdmin && <th>Import State</th>}
                    {catAdmin && <th>Claim</th>}
                    {this.props.isAdmin && <th>Remove</th>}
                  </tr>
                </thead>
                <tbody>
                  {viewableExams
                    .filter(exam => (exam.examtype || "Exams") === examType)
                    .map(exam => (
                      <tr key={exam.filename}>
                        <td {...styles.selectionColumn}>
                          <input
                            type="checkbox"
                            checked={this.state.selectedExams.has(
                              exam.filename,
                            )}
                            onChange={ev =>
                              this.selectedExamsCheckboxValueChanged(
                                exam.filename,
                                ev,
                              )
                            }
                            disabled={!exam.canView}
                          />
                        </td>
                        <td>
                          {(exam.canView && (
                            <Link to={"/exams/" + exam.filename}>
                              {exam.displayname}
                            </Link>
                          )) || (
                            <span {...styles.unviewableExam}>
                              {exam.displayname}
                            </span>
                          )}
                        </td>
                        <td>
                          {exam.remark}
                          {exam.has_printonly ? (
                            <span title="This exam can only be printed. We can not provide this exam online.">
                              {" "}
                              (Print Only)
                            </span>
                          ) : (
                            undefined
                          )}
                        </td>
                        <td>
                          <span
                            title={`There are ${exam.count_cuts} questions, of which ${exam.count_answered} have at least one solution.`}
                          >
                            {exam.count_answered} / {exam.count_cuts}
                          </span>
                          {exam.has_solution ? (
                            <span title="Has an official solution.">
                              {" "}
                              (Solution)
                            </span>
                          ) : (
                            undefined
                          )}
                        </td>
                        {catAdmin && (
                          <td>
                            {exam.public ? "Public" : "Hidden"}
                            {exam.needs_payment ? " (oral)" : ""}
                          </td>
                        )}
                        {catAdmin && (
                          <td>
                            {exam.finished_cuts
                              ? exam.finished_wiki_transfer
                                ? "All done"
                                : "Needs Wiki Import"
                              : "Needs Cuts"}
                          </td>
                        )}
                        {catAdmin && (
                          <td>
                            {!exam.finished_cuts ||
                            !exam.finished_wiki_transfer ? (
                              this.hasValidClaim(exam) ? (
                                exam.import_claim === this.props.username ? (
                                  <button
                                    onClick={() => this.claimExam(exam, false)}
                                  >
                                    Release Claim
                                  </button>
                                ) : (
                                  <span>
                                    Claimed by {exam.import_claim_displayname}
                                  </span>
                                )
                              ) : (
                                <button
                                  onClick={() => this.claimExam(exam, true)}
                                >
                                  Claim Exam
                                </button>
                              )
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        )}
                        {this.props.isAdmin && (
                          <td>
                            <button onClick={ev => this.removeExam(exam)}>
                              X
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        {attachments.length > 0 && (
          <div>
            <h2>Attachments</h2>
            {attachments.map(att => (
              <div key={att.filename}>
                <a
                  href={"/api/filestore/" + att.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {att.displayname}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
