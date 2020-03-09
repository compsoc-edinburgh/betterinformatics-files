import * as React from "react";
import { createSectionRenderer, SectionRenderer } from "../split-render";
import { loadSections } from "../exam-loader";
import { ExamMetaData, PdfSection, Section, SectionKind } from "../interfaces";
import * as pdfjs from "pdfjs-dist";
import { debounce } from "lodash";
import { css } from "glamor";
import PdfSectionComp from "../components/pdf-section";
import AnswerSectionComponent from "../components/answer-section";
import { fetchapi, fetchpost } from "../fetch-utils";
import MetaData from "../components/metadata";
import Colors from "../colors";
import PrintExam from "../components/print-exam";
import globalcss from "../globalcss";
import { TOCNode, TOC } from "../components/table-of-contents";

const RERENDER_INTERVAL = 500;
const MAX_WIDTH = 1200;

const styles = {
  wrapper: css({
    margin: "auto",
  }),
  sectionsButtonSticky: css({
    position: ["sticky", "-webkit-sticky"],
    top: "20px",
    width: "200px",
    float: "right",
    zIndex: "100",
    "@media (max-width: 799px)": {
      position: "static",
    },
  }),
  sectionsButtons: css({
    position: "absolute",
    right: "10px",
    "& button": {
      width: "100%",
    },
    "@media (max-width: 799px)": {
      position: "static",
    },
  }),
  linkBanner: css({
    background: Colors.linkBannerBackground,
    width: "60%",
    margin: "auto",
    marginTop: "10px",
    marginBottom: "20px",
    padding: "5px 10px",
    textAlign: "center",
    "@media (max-width: 699px)": {
      width: "80%",
    },
  }),
  checkWrapper: css({
    background: Colors.cardBackground,
    boxShadow: Colors.cardShadow,
    width: "60%",
    margin: "auto",
    marginBottom: "20px",
    textAlign: "center",
    padding: "5px 10px",
  }),
  licenseText: css({
    color: Colors.silentText,
    paddingLeft: "10px",
  }),
};

interface Props {
  filename: string;
  isAdmin: boolean;
}

interface State {
  pdf?: pdfjs.PDFDocumentProxy;
  renderer?: SectionRenderer;
  width: number;
  dpr: number;
  canEdit: boolean;
  sections?: Section[];
  allShown: boolean;
  addingSectionsActive: boolean;
  editingMetaData: boolean;
  savedMetaData: ExamMetaData;
  updateIntervalId: number;
  error?: string;
  toc?: TOCNode;
}

function widthFromWindow(): number {
  // This compensates for HTML body padding.
  // TODO use a cleaner approach.
  return Math.max(0, Math.min(MAX_WIDTH, document.body.clientWidth - 30));
}

export default class Exam extends React.Component<Props, State> {
  state: State = {
    width: widthFromWindow(),
    dpr: window.devicePixelRatio,
    addingSectionsActive: false,
    canEdit: false,
    editingMetaData: false,
    savedMetaData: {
      canEdit: false,
      isExpert: false,
      canView: true,
      hasPayed: false,
      filename: "",
      category: "",
      category_displayname: "",
      examtype: "",
      displayname: "",
      legacy_solution: "",
      master_solution: "",
      resolve_alias: "",
      remark: "",
      public: false,
      finished_cuts: false,
      finished_wiki_transfer: false,
      is_printonly: false,
      has_solution: false,
      solution_printonly: false,
      needs_payment: false,
      is_oral_transcript: false,
      oral_transcript_checked: false,
      count_cuts: 0,
      count_answered: 0,
      attachments: [],
    },
    allShown: false,
    updateIntervalId: 0,
  };
  updateInterval: NodeJS.Timeout;
  cutVersionInterval: NodeJS.Timeout;
  debouncedUpdatePDFWidth: this["updatePDFWidth"];

  componentDidMount() {
    this.updateInterval = setInterval(this.pollZoom, RERENDER_INTERVAL);
    window.addEventListener("resize", this.onResize);
    this.debouncedUpdatePDFWidth = debounce(
      this.updatePDFWidth,
      RERENDER_INTERVAL,
    );

    this.loadMetaData();

    this.cutVersionInterval = setInterval(this.updateCutVersion, 60000);

    this.loadPDF();
  }

  loadMetaData = () => {
    fetchapi(`/api/exam/metadata/${this.props.filename}/`)
      .then(res => {
        this.setState({
          canEdit: res.value.canEdit,
          savedMetaData: res.value,
        });
        this.setDocumentTitle();
      })
      .catch(err => {
        this.setState({ error: err.toString() });
      });
  };

  gnerateTableOfContents = (sections: Section[] | undefined) => {
    if (sections === undefined) {
      return undefined;
    }
    const rootNode = new TOCNode("[root]", "");
    for (const section of sections) {
      if (section.kind === SectionKind.Answer) {
        const parts = section.name.split(", ");
        const jumpTarget = `${section.oid}-${parts.join("-")}`;
        rootNode.add(parts, jumpTarget);
      }
    }
    console.log(rootNode);
    return rootNode;
  };

  loadPDF = async () => {
    try {
      const pdf = await pdfjs.getDocument(
        "/api/exam/pdf/exam/" + this.props.filename + "/",
      ).promise;
      const w = this.state.width * this.state.dpr;
      this.setState({ pdf, renderer: await createSectionRenderer(pdf, w) });
      this.loadSectionsFromBackend(pdf.numPages);
    } catch (e) {
      this.setState({
        error: e.toString(),
      });
    }
  };

  setDocumentTitle() {
    document.title =
      this.state.savedMetaData.displayname + " - VIS Community Solutions";
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
    clearInterval(this.cutVersionInterval);
    window.removeEventListener("resize", this.onResize);
    if (this.state.renderer) {
      this.state.renderer.destroy();
    }
    const pdf = this.state.pdf;
    if (pdf) {
      pdf.destroy();
    }
    this.setState({
      pdf: undefined,
      renderer: undefined,
    });
  }

  componentDidUpdate(
    prevProps: Readonly<Props>,
    prevState: Readonly<State>,
  ): void {
    if (
      prevState.dpr !== this.state.dpr ||
      prevState.width !== this.state.width
    ) {
      this.debouncedUpdatePDFWidth();
    }
  }

  onResize = () => {
    const w = widthFromWindow();
    if (w === this.state.width) {
      return;
    }
    this.setState({ width: w });
  };

  pollZoom = () => {
    const dpr = window.devicePixelRatio;
    if (dpr === this.state.dpr) {
      return;
    }
    this.setState({ dpr });
  };

  updatePDFWidth = () => {
    const { renderer } = this.state;
    if (renderer) {
      const w = this.state.width * this.state.dpr;
      renderer.setTargetWidth(w);
    }
  };

  loadSectionsFromBackend = (numPages: number) => {
    loadSections(this.props.filename, numPages)
      .then(sections => {
        this.setState({
          sections: sections,
          toc: this.gnerateTableOfContents(sections),
        });
      })
      .catch(err => {
        this.setState({ error: err.toString() });
      });
  };

  updateCutVersion = () => {
    fetchapi(`/api/exam/cutversions/${this.props.filename}/`)
      .then(res => {
        const versions = res.value;
        this.setState(prevState => {
          const newState = { ...prevState };
          if (newState.sections) {
            newState.sections.forEach(section => {
              if (section.kind === SectionKind.Answer) {
                section.cutVersion = versions[section.oid];
              }
            });
          }
          return newState;
        });
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  addSection = (ev: React.MouseEvent<HTMLElement>, section: PdfSection) => {
    const boundingRect = ev.currentTarget.getBoundingClientRect();
    const yoff = ev.clientY - boundingRect.top;
    const relative = yoff / boundingRect.height;
    const start = section.start.position;
    const end = section.end.position;
    let relHeight = start + relative * (end - start);

    if (!ev.shiftKey && this.state.renderer) {
      relHeight = this.state.renderer.optimizeCutPosition(
        section.start.page - 1,
        relHeight,
      );
    }

    fetchpost(`/api/exam/addcut/${this.props.filename}/`, {
      name: "",
      pageNum: section.start.page,
      relHeight: relHeight,
    })
      .then(() => {
        this.setState({
          error: "",
        });
        if (this.state.pdf) {
          this.loadSectionsFromBackend(this.state.pdf.numPages);
        }
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };

  gotoPDF = () => {
    window.open(
      `/api/exam/pdf/exam/${this.props.filename}/?download`,
      "_blank",
    );
  };

  reportProblem = () => {
    const subject = encodeURIComponent("[VIS] Community Solutions: Feedback");
    const body = encodeURIComponent(
      `Concerning the exam '${this.state.savedMetaData.displayname}' of the course '${this.state.savedMetaData.category}' ...`,
    );
    window.location.href = `mailto:communitysolutions@vis.ethz.ch?subject=${subject}&body=${body}`;
  };

  setAllHidden = (hidden: boolean) => {
    this.setState(prevState => {
      const newState = { ...prevState };
      if (newState.sections) {
        newState.sections.forEach(section => {
          if (section.kind === SectionKind.Answer) {
            section.hidden = hidden;
          }
        });
      }
      newState.allShown = !hidden;
      return newState;
    });
  };

  toggleHidden = (sectionOid: string) => {
    this.setState(prevState => {
      const newState = { ...prevState };
      if (newState.sections) {
        for (const section of newState.sections) {
          if (
            section.kind === SectionKind.Answer &&
            section.oid === sectionOid
          ) {
            if (!section.hidden) {
              newState.allShown = false;
            }
            section.hidden = !section.hidden;
          }
        }
      }
      return newState;
    });
  };

  toggleAddingSectionActive = () => {
    this.setState((state, props) => {
      return { addingSectionsActive: !state.addingSectionsActive };
    });
  };

  toggleEditingMetadataActive = () => {
    if (!this.state.editingMetaData) {
      window.scrollTo(0, 0);
    }
    this.setState(state => {
      return {
        editingMetaData: !state.editingMetaData,
      };
    });
  };

  setAllDone = () => {
    const update = {
      public: true,
      finished_cuts: true,
      finished_wiki_transfer: true,
    };
    if (this.state.editingMetaData) {
      this.toggleEditingMetadataActive();
    }
    fetchpost(`/api/exam/setmetadata/${this.props.filename}/`, update).then(
      res => {
        this.setState(prev => ({
          savedMetaData: {
            ...prev.savedMetaData,
            ...update,
          },
        }));
      },
    );
  };

  metaDataChanged = (newMetaData: ExamMetaData) => {
    this.setState({
      savedMetaData: newMetaData,
    });
    this.setDocumentTitle();
  };

  markPaymentExamChecked = () => {
    fetchpost(`/api/payment/markexamchecked/${this.props.filename}/`, {})
      .then(() => {
        this.loadMetaData();
      })
      .catch(err => {
        this.setState({
          error: err.toString(),
        });
      });
  };
  render() {
    if (!this.state.savedMetaData.canView) {
      if (
        this.state.savedMetaData.needs_payment &&
        !this.state.savedMetaData.hasPayed
      ) {
        return (
          <div>
            You have to pay a deposit of 20 CHF in the VIS bureau in order to
            see oral exams. After submitting a report of your own oral exam you
            can get your deposit back.
          </div>
        );
      }
      return <div>You can not view this exam at this time.</div>;
    }
    const { renderer, width, dpr, sections } = this.state;
    const wikitransform = this.state.savedMetaData.legacy_solution
      ? this.state.savedMetaData.legacy_solution.split("/").pop()
      : "";
    return (
      <div>
        {this.state.error && (
          <div {...css({ position: ["sticky", "-webkit-sticky"] })}>
            {this.state.error}
          </div>
        )}
        <div {...styles.sectionsButtonSticky}>
          <div {...styles.sectionsButtons}>
            <div>
              <button onClick={this.gotoPDF}>Download PDF</button>
            </div>
            <div>
              <button onClick={() => this.setAllHidden(this.state.allShown)}>
                {this.state.allShown ? "Hide" : "Show"} All
              </button>
            </div>
            <div>
              <button onClick={this.reportProblem}>Report Problem</button>
            </div>
            {this.state.canEdit && [
              <div key="metadata">
                <button onClick={this.toggleEditingMetadataActive}>
                  Edit MetaData
                </button>
              </div>,
              !(
                this.state.savedMetaData.public &&
                this.state.savedMetaData.finished_cuts &&
                this.state.savedMetaData.finished_wiki_transfer
              ) && (
                <div key="alldone">
                  <button onClick={this.setAllDone}>Set All Done</button>
                </div>
              ),
              <div key="cuts">
                <button onClick={this.toggleAddingSectionActive}>
                  {(this.state.addingSectionsActive && "Disable Adding Cuts") ||
                    "Enable Adding Cuts"}
                </button>
              </div>,
            ]}
            <div {...styles.licenseText}>
              <small {...globalcss.noLinkColor}>
                All answers are licensed as <br />
                <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
                  CC BY-NC-SA 4.0
                </a>
                .
              </small>
            </div>
          </div>
        </div>
        {this.state.editingMetaData && (
          <MetaData
            filename={this.props.filename}
            savedMetaData={this.state.savedMetaData}
            onChange={this.metaDataChanged}
            onFinishEdit={this.toggleEditingMetadataActive}
          />
        )}
        {this.state.savedMetaData.is_oral_transcript &&
          !this.state.savedMetaData.oral_transcript_checked && (
            <div {...styles.checkWrapper}>
              This is a transcript of an oral exam. It needs to be checked
              whether it is a valid transcript.
              <br />
              <button onClick={this.markPaymentExamChecked}>
                Mark Transcript as Checked
              </button>
            </div>
          )}
        {this.state.savedMetaData.is_printonly && (
          <PrintExam
            title="exam"
            examtype="exam"
            filename={this.props.filename}
          />
        )}
        {this.state.savedMetaData.has_solution &&
          this.state.savedMetaData.solution_printonly && (
            <PrintExam
              title="solution"
              examtype="solution"
              filename={this.props.filename}
            />
          )}
        {this.state.savedMetaData.legacy_solution && (
          <div {...styles.linkBanner}>
            <a href={this.state.savedMetaData.legacy_solution} target="_blank">
              Legacy Solution in VISki
            </a>
            {this.state.canEdit && [
              " | ",
              <a
                href={"/legacy/transformwiki/" + wikitransform}
                target="_blank"
                key="key"
              >
                Transform VISki to Markdown
              </a>,
            ]}
          </div>
        )}
        {this.state.savedMetaData.master_solution && (
          <div {...styles.linkBanner}>
            <a href={this.state.savedMetaData.master_solution} target="_blank">
              Official Solution (external)
            </a>
          </div>
        )}
        {this.state.savedMetaData.has_solution &&
          !this.state.savedMetaData.solution_printonly && (
            <div {...styles.linkBanner}>
              <a
                href={"/api/exam/pdf/solution/" + this.props.filename + "/"}
                target="_blank"
              >
                Official Solution
              </a>
            </div>
          )}
        {this.state.savedMetaData.attachments.map(att => (
          <div {...styles.linkBanner} key={att.filename}>
            <a
              href={"/api/filestore/get/" + att.filename + "/"}
              target="_blank"
            >
              {att.displayname}
            </a>
          </div>
        ))}
        {(renderer && sections && (
          <div style={{ width: width }} {...styles.wrapper}>
            {this.state.toc && <TOC toc={this.state.toc} />}
            {sections.map(e => {
              switch (e.kind) {
                case SectionKind.Answer:
                  return (
                    <AnswerSectionComponent
                      name={e.name}
                      key={e.oid}
                      isAdmin={this.props.isAdmin}
                      isExpert={this.state.savedMetaData.isExpert}
                      filename={this.props.filename}
                      oid={e.oid}
                      width={width}
                      canDelete={this.state.canEdit}
                      onSectionChange={() =>
                        this.state.pdf
                          ? this.loadSectionsFromBackend(
                              this.state.pdf.numPages,
                            )
                          : false
                      }
                      onCutNameChange={(newName: string) => {
                        e.name = newName;
                        this.setState({
                          toc: this.gnerateTableOfContents(this.state.sections),
                        });
                      }}
                      onToggleHidden={() => this.toggleHidden(e.oid)}
                      hidden={e.hidden}
                      cutVersion={e.cutVersion}
                    />
                  );
                case SectionKind.Pdf:
                  return (
                    <PdfSectionComp
                      key={e.key}
                      section={e}
                      renderer={renderer}
                      width={width}
                      dpr={dpr}
                      renderText={!this.state.addingSectionsActive}
                      // ts does not like it if this is undefined...
                      onClick={
                        this.state.canEdit && this.state.addingSectionsActive
                          ? this.addSection
                          : ev => ev
                      }
                    />
                  );
                default:
                  return null as never;
              }
            })}
          </div>
        )) || <p>Loading ...</p>}
      </div>
    );
  }
}
