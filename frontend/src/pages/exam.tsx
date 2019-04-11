import * as React from "react";
import {renderDocument, SectionRenderer} from "../split-render";
import {loadSections} from "../exam-loader";
import {ExamMetaData, PdfSection, Section, SectionKind} from "../interfaces";
import * as pdfjs from "pdfjs-dist";
import {debounce} from "lodash";
import {css} from "glamor";
import PdfSectionComp from "../components/pdf-section";
import AnswerSectionComponent from "../components/answer-section";
import {fetchapi, fetchpost} from "../fetch-utils";
import MetaData from "../components/metadata";
import Colors from "../colors";
import PrintExam from "../components/print-exam";

const RERENDER_INTERVAL = 500;
const MAX_WIDTH = 1200;

const styles = {
  wrapper: css({
    margin: "auto",
  }),
  sectionsButton: css({
    position: ["sticky", "-webkit-sticky"],
    top: "20px",
    float: "right",
    zIndex: "100",
    "& button": {
      width: "100%",
    }
  }),
  linkBanner: css({
    background: Colors.linkBannerBackground,
    width: "60%",
    margin: "auto",
    marginTop: "10px",
    marginBottom: "10px",
    padding: "5px 10px",
    textAlign: "center",
    "@media (max-width: 699px)": {
      width: "80%",
    },
  })
};

interface Props {
  filename: string;
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
      canView: true,
      hasPayed: false,
      filename: "",
      category: "",
      examtype: "",
      displayname: "",
      legacy_solution: "",
      master_solution: "",
      resolve_alias: "",
      remark: "",
      public: false,
      finished_cuts: false,
      finished_wiki_transfer: false,
      has_printonly: false,
      has_solution: false,
      payment_category: "",
    },
    allShown: false,
    updateIntervalId: 0,
  };
  updateInterval: NodeJS.Timer;
  cutVersionInterval: NodeJS.Timer;
  debouncedRender: (this["renderDocumentToState"]);

  componentDidMount() {
    this.updateInterval = setInterval(this.pollZoom, RERENDER_INTERVAL);
    window.addEventListener("resize", this.onResize);
    this.debouncedRender = debounce(this.renderDocumentToState, RERENDER_INTERVAL);

    fetchapi(`/api/exam/${this.props.filename}/metadata`)
      .then((res) => {
        this.setState({
          canEdit: res.value.canEdit,
          savedMetaData: res.value,
        });
        this.setDocumentTitle();
      })
      .catch(err =>{
        this.setState({error: err.toString()});
      });

    this.cutVersionInterval = setInterval(this.updateCutVersion, 60000);

    this.loadPDF();
  }

  loadPDF = async () => {
    // tslint:disable-next-line:no-any
    const PDFJS: pdfjs.PDFJSStatic = pdfjs as any;
    try {
      const pdf = await PDFJS.getDocument("/api/pdf/exam/" + this.props.filename);

      await Promise.all([
        this.renderDocumentToState(pdf),
        this.loadSectionsFromBackend(pdf)
      ]);
    } catch (e) {
      // we do not report any error as it might be caused by print_only
    }
  };

  setDocumentTitle() {
    document.title = this.state.savedMetaData.displayname + " - VIS Community Solutions";
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
    clearInterval(this.cutVersionInterval);
    window.removeEventListener("resize", this.onResize);
    this.setState({
      pdf: undefined,
      renderer: undefined
    });
  }

  onResize = () => {
    const w = widthFromWindow();
    if (w === this.state.width) {
      return;
    }
    this.setState({width: w});
    const {pdf} = this.state;
    if (pdf) {
      this.debouncedRender(pdf);
    }
  };

  pollZoom = () => {
    const dpr = window.devicePixelRatio;
    if (dpr === this.state.dpr) {
      return;
    }
    this.setState({dpr});
    const {pdf} = this.state;
    if (pdf) {
      this.renderDocumentToState(pdf);
    }
  };

  renderDocumentToState = async (pdf: pdfjs.PDFDocumentProxy) => {
    const w = this.state.width * this.state.dpr;
    this.setState({pdf, renderer: await renderDocument(pdf, w)});
  };

  loadSectionsFromBackend = (pdf: pdfjs.PDFDocumentProxy) => {
    loadSections(this.props.filename, pdf.numPages)
      .then((sections) => {
        this.setState({sections: sections});
      })
      .catch(err => {
        this.setState({error: err.toString()});
      });
  };

  updateCutVersion = () => {
    fetchapi(`/api/exam/${this.props.filename}/cutversions`)
      .then(res => {
        const versions = res.value;
        this.setState(prevState => {
          let newState = {...prevState};
          if (newState.sections) {
            newState.sections.forEach(section => {
              if (section.kind === SectionKind.Answer) {
                section.cutVersion = versions[section.oid];
              }
            });
          }
          return newState;
        })
      })
  };

  addSection = (ev: React.MouseEvent<HTMLElement>, section: PdfSection) => {
    const boundingRect = ev.currentTarget.getBoundingClientRect();
    const yoff = ev.clientY - boundingRect.top;
    const relative = yoff / boundingRect.height;
    const start = section.start.position;
    const end = section.end.position;
    const relHeight = start + relative * (end - start);

    fetchpost(`/api/exam/${this.props.filename}/newanswersection`, {
      pageNum: section.start.page,
      relHeight: relHeight
    })
      .then(() => {
        if (this.state.pdf) {
          this.loadSectionsFromBackend(this.state.pdf);
        }
      });
  };

  gotoPDF = () => {
    window.open(`/api/pdf/exam/${this.props.filename}`, '_blank');
  };

  setAllHidden = (hidden: boolean) => {
    this.setState(prevState => {
      let newState = {...prevState};
      if (newState.sections) {
        newState.sections.forEach(section => {
          if (section.kind === SectionKind.Answer) {
            section.hidden = hidden;
          }
        });
      }
      newState.allShown = !hidden;
      return newState;
    })
  };

  toggleHidden = (sectionOid: string) => {
    this.setState(prevState => {
      let newState = {...prevState};
      if (newState.sections) {
        for (let section of newState.sections) {
          if (section.kind === SectionKind.Answer && section.oid === sectionOid) {
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
      return {addingSectionsActive: !state.addingSectionsActive};
    });
  };

  toggleEditingMetadataActive = () => {
    if (!this.state.editingMetaData) {
      window.scrollTo(0, 0);
    }
    this.setState((state) => {
      return {
        editingMetaData: !state.editingMetaData
      };
    });
  };

  metaDataChanged = (newMetaData: ExamMetaData) => {
    this.setState({
      savedMetaData: newMetaData,
    });
    this.setDocumentTitle();
  };

  render() {
    if (!this.state.savedMetaData.canView) {
      if (this.state.savedMetaData.payment_category.length > 0 && !this.state.savedMetaData.hasPayed) {
        return <div>You have to pay a deposit of 20 CHF in the VIS bureau in order to see oral exams. After submitting a report of your own oral exam you can get your deposit back.</div>
      }
      return <div>You can not view this exam at this time.</div>
    }
    if (this.state.error) {
      return <div>Could not load exam... {this.state.error}</div>;
    }
    const {renderer, width, dpr, sections} = this.state;
    const wikitransform = this.state.savedMetaData.legacy_solution ? this.state.savedMetaData.legacy_solution.split("/").pop() : "";
    return (
      <div>

        <div {...styles.sectionsButton}>
          <div>
            <button onClick={this.gotoPDF}>Download PDF</button>
          </div>
          <div>
            <button onClick={() => this.setAllHidden(this.state.allShown)}>{this.state.allShown ? 'Hide' : 'Show'} All</button>
          </div>
          {this.state.canEdit && [
            <div key="metadata">
              <button onClick={this.toggleEditingMetadataActive}>Edit MetaData</button>
            </div>,
            <div key="cuts">
              <button onClick={this.toggleAddingSectionActive}>{this.state.addingSectionsActive && "Disable Adding Cuts" || "Enable Adding Cuts"}</button>
            </div>
            ]
          }
        </div>
        {this.state.editingMetaData &&
          <MetaData filename={this.props.filename} savedMetaData={this.state.savedMetaData}
                    onChange={this.metaDataChanged} onFinishEdit={this.toggleEditingMetadataActive}/>}
        {this.state.savedMetaData.has_printonly && <PrintExam filename={this.props.filename}/>}
        {this.state.savedMetaData.legacy_solution &&
          <div {...styles.linkBanner}>
            <a href={this.state.savedMetaData.legacy_solution} target="_blank">Legacy Solution in VISki</a>
            {this.state.canEdit && [" | ", <a href={"/legacy/transformwiki/" + wikitransform} target="_blank">Transform VISki to Markdown</a>]}
          </div>}
        {this.state.savedMetaData.master_solution &&
        <div {...styles.linkBanner}>
          <a href={this.state.savedMetaData.master_solution} target="_blank">Official Solution</a>
        </div>}
        {this.state.savedMetaData.has_solution &&
        <div {...styles.linkBanner}>
          <a href={"/api/pdf/solution/" + this.props.filename} target="_blank">Official Solution</a>
        </div>}
        {(renderer && sections) &&
          <div style={{width: width}} {...styles.wrapper}>
            {sections.map(e => {
              switch (e.kind) {
                case SectionKind.Answer:
                  return <AnswerSectionComponent
                    key={e.oid}
                    filename={this.props.filename}
                    oid={e.oid}
                    width={width}
                    canDelete={this.state.canEdit}
                    onSectionChange={() => this.state.pdf ? this.loadSectionsFromBackend(this.state.pdf) : false}
                    onToggleHidden={() => this.toggleHidden(e.oid)}
                    hidden={e.hidden}
                    cutVersion={e.cutVersion}
                  />;
                case SectionKind.Pdf:
                  return (
                    <PdfSectionComp
                      key={e.key}
                      section={e}
                      renderer={renderer}
                      width={width}
                      dpr={dpr}
                      // ts does not like it if this is undefined...
                      onClick={(this.state.canEdit && this.state.addingSectionsActive) ? this.addSection : (ev) => ev}
                    />
                  );
                default:
                  return null as never;
              }
            })}
          </div>
          ||
          <p>Loading ...</p>
        }
      </div>
    );
  }
}
